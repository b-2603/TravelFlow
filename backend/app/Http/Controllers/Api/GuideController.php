<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuideStatusUpdateRequest;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Partner;
use App\Models\Tour;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GuideController extends Controller
{
    public function assignments(Request $request)
    {
        $guideId = (string) $request->user()->_id;

        $tours = Tour::whereNull('deleted_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function (Tour $tour) use ($guideId) {
                if ((string) ($tour->assigned_guide_id ?? '') === $guideId) {
                    return true;
                }

                return collect($tour->departures ?? [])
                    ->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);
            })
            ->values();

        $partnerIds = $tours
            ->flatMap(fn ($tour) => collect($tour->linked_partner_ids ?? [])->map(fn ($id) => (string) $id))
            ->filter()
            ->unique()
            ->values();

        $partners = $partnerIds->isEmpty()
            ? collect()
            : Partner::whereIn('_id', $partnerIds->all())->get()->keyBy(fn ($partner) => (string) $partner->_id);

        $bookings = Booking::whereIn('tour_id', $tours->pluck('_id')->all())
            ->with(['user'])
            ->get()
            ->groupBy(fn ($booking) => (string) $booking->tour_id.'|'.optional($booking->departure_date)->toDateString());

        $assignments = $tours
            ->flatMap(function (Tour $tour) use ($guideId, $bookings, $partners) {
                return collect($tour->departures ?? [])
                    ->filter(function ($departure) use ($guideId, $tour) {
                        $departureGuideId = (string) ($departure['assigned_guide_id'] ?? '');
                        $tourGuideId = (string) ($tour->assigned_guide_id ?? '');

                        return $departureGuideId === $guideId || (! $departureGuideId && $tourGuideId === $guideId);
                    })
                    ->map(function ($departure) use ($tour, $bookings, $partners) {
                        $departureDate = $departure['date'] ?? null;
                        $bookingItems = $bookings->get((string) $tour->_id.'|'.$departureDate, collect());
                        $partnerItems = collect($tour->linked_partner_ids ?? [])
                            ->map(fn ($id) => $partners->get((string) $id))
                            ->filter()
                            ->map(fn ($partner) => [
                                'id' => (string) $partner->_id,
                                'company_name' => $partner->company_name,
                                'service_type' => $partner->service_type,
                                'contact_name' => data_get($partner->contact_info, 'contact_name'),
                                'phone' => data_get($partner->contact_info, 'phone'),
                                'email' => data_get($partner->contact_info, 'email'),
                            ])
                            ->values();

                        $progressHistory = collect($tour->guide_progress ?? [])
                            ->filter(fn ($item) => ($item['departure_date'] ?? null) === $departureDate)
                            ->values();

                        return [
                            'assignment_id' => (string) $tour->_id.'|'.$departureDate,
                            'tour_id' => (string) $tour->_id,
                            'tour_title' => $tour->title,
                            'tour_slug' => $tour->slug,
                            'destination' => $tour->destination,
                            'category' => $tour->category,
                            'duration_days' => $tour->duration_days,
                            'tour_status' => $tour->status,
                            'images' => $tour->images ?? [],
                            'highlights' => $tour->highlights ?? [],
                            'itinerary' => $tour->itinerary ?? [],
                            'departure' => [
                                'date' => $departureDate,
                                'status' => $departure['status'] ?? 'active',
                                'available_slots' => (int) ($departure['available_slots'] ?? 0),
                                'price_override' => $departure['price_override'] ?? null,
                            ],
                            'assignment_state' => $this->resolveAssignmentState($departureDate, $progressHistory),
                            'latest_progress' => $progressHistory->last(),
                            'guide_progress' => $progressHistory->all(),
                            'passenger_count' => (int) $bookingItems->sum('num_pax'),
                            'bookings_count' => $bookingItems->count(),
                            'bookings' => $bookingItems->map(function ($booking) {
                                return [
                                    'id' => (string) $booking->_id,
                                    'status' => $booking->status,
                                    'payment_status' => $booking->payment_status,
                                    'num_pax' => $booking->num_pax,
                                    'customer' => $booking->relationLoaded('user') && $booking->user ? [
                                        'id' => (string) $booking->user->_id,
                                        'name' => $booking->user->name,
                                        'phone' => $booking->user->phone,
                                        'email' => $booking->user->email,
                                    ] : null,
                                    'passengers' => collect($booking->passengers ?? [])->map(fn ($passenger) => [
                                        'name' => $passenger['name'] ?? null,
                                        'dob' => $passenger['dob'] ?? null,
                                        'passport' => $passenger['passport'] ?? null,
                                    ])->values()->all(),
                                    'note' => $booking->note,
                                    'special_requirements' => $booking->special_requirements ?? [],
                                ];
                            })->values()->all(),
                            'partners' => $partnerItems->all(),
                        ];
                    });
            })
            ->sortBy('departure.date')
            ->values();

        return $this->apiResponse(true, $assignments, 'Lấy danh sách phân công hướng dẫn viên thành công.');
    }

    public function updateStatus(GuideStatusUpdateRequest $request, string $id)
    {
        $tour = Tour::find($id);

        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour được phân công.', 404);
        }

        $guideId = (string) $request->user()->_id;
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép cập nhật tour này.', 403);
        }

        $progress = $tour->guide_progress ?? [];
        $progress[] = [
            'status' => $request->string('status')->toString(),
            'note' => $request->input('note'),
            'departure_date' => $request->input('departure_date'),
            'incident_type' => $request->input('incident_type'),
            'day_note' => $request->input('day_note'),
            'images' => collect($request->file('image_files', []))
                ->map(function ($file) {
                    return Storage::url($file->store('guide-progress', 'public'));
                })
                ->values()
                ->all(),
            'attendance' => collect($request->input('attendance', []))
                ->map(fn ($item) => [
                    'name' => $item['name'] ?? null,
                    'present' => (bool) ($item['present'] ?? false),
                ])
                ->values()
                ->all(),
            'updated_by' => $guideId,
            'updated_at' => Carbon::now()->toISOString(),
        ];

        $tour->guide_progress = $progress;
        $tour->save();

        if ($request->string('status')->toString() === 'completed' && $request->filled('departure_date')) {
            $departureDate = Carbon::parse($request->input('departure_date'))->toDateString();

            Booking::where('tour_id', $tour->_id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->get()
                ->filter(function (Booking $booking) use ($departureDate) {
                    return optional($booking->departure_date)->toDateString() === $departureDate;
                })
                ->each(function (Booking $booking) {
                    $booking->status = 'completed';
                    $booking->updated_at = Carbon::now();
                    $booking->save();
                });
        }

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'guide_status_updated',
            'module' => 'guide',
            'detail' => [
                'tour_id' => (string) $tour->_id,
                'departure_date' => $request->input('departure_date'),
                'status' => $request->string('status')->toString(),
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, $tour, 'Cập nhật tiến trình tour thành công.');
    }

    private function resolveAssignmentState(?string $departureDate, Collection $progressHistory): string
    {
        $latestStatus = $progressHistory->last()['status'] ?? null;

        if ($latestStatus === 'completed') {
            return 'completed';
        }

        if (in_array($latestStatus, ['boarding', 'in_progress', 'issue'], true)) {
            return 'ongoing';
        }

        if (! $departureDate) {
            return 'upcoming';
        }

        $date = Carbon::parse($departureDate)->startOfDay();
        $today = now()->startOfDay();

        if ($date->lt($today)) {
            return 'completed';
        }

        if ($date->equalTo($today)) {
            return 'ongoing';
        }

        return 'upcoming';
    }
}
