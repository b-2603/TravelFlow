<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuideStatusUpdateRequest;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Partner;
use App\Models\SupportTicket;
use App\Models\Tour;
use App\Services\EmailService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GuideController extends Controller
{
    public function __construct(
        private readonly EmailService $emailService
    ) {
    }

    private function getAssignedTours(string $guideId)
    {
        return Tour::query()
            ->whereNull('deleted_at')
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->with(['bookings.user', 'guide'])
            ->get()
            ->filter(fn (Tour $tour) => $this->guideHasPermission($tour, $guideId))
            ->values();
    }

    private function guideHasPermission(Tour $tour, string $guideId): bool
    {
        return (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);
    }

    /**
     * Dashboard của hướng dẫn viên
     * Hiển thị thống kê và thông tin tổng quan
     */
    public function dashboard(Request $request)
    {
        $guideId = (string) $request->user()->_id;
        $today = Carbon::today()->toDateString();

        // Lấy tất cả tours và departure được phân công cho guide hiện tại
        $allTours = $this->getAssignedTours($guideId);

        // Thống kê theo trạng thái
        $upcoming = 0;
        $ongoing = 0;
        $completed = 0;

        foreach ($allTours as $tour) {
            $departures = collect($tour->departures ?? []);
            foreach ($departures as $departure) {
                $state = $this->resolveAssignmentState($departure['date'] ?? null, collect($tour->guide_progress ?? [])->filter(fn ($p) => ($p['departure_date'] ?? null) === ($departure['date'] ?? null)));
                if ($state === 'upcoming') $upcoming++;
                elseif ($state === 'ongoing') $ongoing++;
                else $completed++;
            }
        }

        // Tổng số khách đã hướng dẫn
        $totalPax = Booking::whereIn('tour_id', $allTours->pluck('_id')->all())
            ->whereIn('status', ['completed', 'confirmed', 'in_progress'])
            ->sum('num_pax');

        // Các tour sắp tới (3 tour gần nhất)
        $nextTours = $allTours->filter(function ($tour) use ($guideId) {
            return collect($tour->departures ?? [])->contains(function ($d) use ($guideId) {
                return (string) ($d['assigned_guide_id'] ?? '') === $guideId &&
                    Carbon::parse($d['date'])->isFuture();
            });
        })->sortBy(function ($tour) use ($guideId) {
            $first = collect($tour->departures ?? [])->first(function ($d) use ($guideId) {
                return (string) ($d['assigned_guide_id'] ?? '') === $guideId &&
                    Carbon::parse($d['date'])->isFuture();
            });

            return $first['date'] ?? '9999-12-31';
        })->take(3)->values();

        $todayTours = $allTours->flatMap(function ($tour) use ($guideId, $today) {
            return collect($tour->departures ?? [])
                ->filter(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId && ($departure['date'] ?? null) === $today)
                ->map(function ($departure) use ($tour) {
                    return [
                        'id' => (string) $tour->_id,
                        'title' => $tour->title,
                        'destination' => $tour->destination,
                        'departure_date' => $departure['date'] ?? null,
                        'available_slots' => (int) ($departure['available_slots'] ?? 0),
                        'status' => $departure['status'] ?? 'active',
                    ];
                });
        })->values();

        $recentUpdates = $allTours->flatMap(function ($tour) {
            return collect($tour->guide_progress ?? [])
                ->map(function ($item) use ($tour) {
                    return [
                        'tour_id' => (string) $tour->_id,
                        'tour_title' => $tour->title,
                        'status' => $item['status'] ?? null,
                        'departure_date' => $item['departure_date'] ?? null,
                        'day_number' => $item['day_number'] ?? null,
                        'note' => $item['note'] ?? null,
                        'day_note' => $item['day_note'] ?? null,
                        'incident_type' => $item['incident_type'] ?? null,
                        'updated_at' => $item['updated_at'] ?? null,
                    ];
                });
        })->sortByDesc('updated_at')->take(5)->values();

        return $this->apiResponse(true, [
            'stats' => [
                'total_tours' => $allTours->count(),
                'upcoming_tours' => $upcoming,
                'ongoing_tours' => $ongoing,
                'completed_tours' => $completed,
                'total_pax_served' => (int) $totalPax,
            ],
            'today_tours' => $todayTours,
            'next_tours' => $nextTours->map(function ($tour) use ($guideId) {
                $nextDeparture = collect($tour->departures ?? [])->first(fn ($d) => 
                    (string) ($d['assigned_guide_id'] ?? '') === $guideId &&
                    Carbon::parse($d['date'])->isFuture()
                );
                return [
                    'id' => (string) $tour->_id,
                    'title' => $tour->title,
                    'destination' => $tour->destination,
                    'departure_date' => $nextDeparture['date'] ?? null,
                    'duration_days' => $tour->duration_days,
                ];
            }),
            'recent_updates' => $recentUpdates,
        ], 'Lấy dashboard hướng dẫn viên thành công.');
    }

    /**
     * Xem danh sách tour được phân công
     * Hỗ trợ lọc theo trạng thái: upcoming, ongoing, completed
     */
    public function assignments(Request $request)
    {
        $guideId = (string) $request->user()->_id;
        $statusFilter = $request->input('status'); // upcoming, ongoing, completed

        $tours = $this->getAssignedTours($guideId);

        // Lọc theo trạng thái nếu có
        if ($statusFilter) {
            $tours = $tours->filter(function (Tour $tour) use ($guideId, $statusFilter) {
                $departures = collect($tour->departures ?? []);
                foreach ($departures as $departure) {
                    $departureGuideId = (string) ($departure['assigned_guide_id'] ?? '');
                    $tourGuideId = (string) ($tour->assigned_guide_id ?? '');
                    
                    if ($departureGuideId !== $guideId && $tourGuideId !== $guideId) {
                        continue;
                    }

                    $progressHistory = collect($tour->guide_progress ?? [])
                        ->filter(fn ($item) => ($item['departure_date'] ?? null) === ($departure['date'] ?? null));
                    $state = $this->resolveAssignmentState($departure['date'] ?? null, $progressHistory);

                    if ($state === $statusFilter) {
                        return true;
                    }
                }
                return false;
            });
        }

        $partnerIds = $tours
            ->flatMap(fn ($tour) => collect($tour->linked_partner_ids ?? [])->map(fn ($id) => (string) $id))
            ->filter()
            ->unique()
            ->values();

        $partners = $partnerIds->isEmpty()
            ? collect()
            : Partner::whereIn('_id', $partnerIds->all())->get()->keyBy(fn ($partner) => (string) $partner->_id);

        $tourIds = $tours->pluck('_id')->all();
        $bookings = Booking::whereIn('tour_id', $tourIds)
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

        return $this->apiResponse(true, $assignments->all(), 'Lấy danh sách phân công hướng dẫn viên thành công.');
    }

    /**
     * Xem chi tiết một tour được phân công
     */
    public function showAssignment(Request $request, string $tourId, ?string $departureDate = null)
    {
        $guideId = (string) $request->user()->_id;

        $tour = Tour::where('_id', $tourId)
            ->whereNull('deleted_at')
            ->with(['bookings' => function ($query) {
                $query->with('user');
            }])
            ->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép xem tour này.', 403);
        }

        // Lọc theo departure_date nếu có
        $departures = collect($tour->departures ?? []);
        if ($departureDate) {
            $departures = $departures->filter(fn ($d) => ($d['date'] ?? null) === $departureDate);
        }

        // Lấy partners
        $partnerIds = collect($tour->linked_partner_ids ?? [])->map(fn ($id) => (string) $id)->filter()->unique();
        $partners = $partnerIds->isEmpty()
            ? collect()
            : Partner::whereIn('_id', $partnerIds->all())->get()->keyBy(fn ($partner) => (string) $partner->_id);

        $result = $departures->map(function ($departure) use ($tour, $partners) {
            $departureDate = $departure['date'] ?? null;
            
            // Lấy bookings cho departure này
            $bookings = $tour->bookings->filter(fn ($b) => 
                optional($b->departure_date)->toDateString() === $departureDate
            );

            $partnerItems = collect($tour->linked_partner_ids ?? [])
                ->map(fn ($id) => $partners->get((string) $id))
                ->filter()
                ->map(fn ($partner) => [
                    'id' => (string) $partner->_id,
                    'company_name' => $partner->company_name,
                    'service_type' => $partner->service_type,
                    'contact_info' => $partner->contact_info ?? [],
                ])
                ->values();

            $progressHistory = collect($tour->guide_progress ?? [])
                ->filter(fn ($item) => ($item['departure_date'] ?? null) === $departureDate)
                ->values();

            return [
                'tour' => [
                    'id' => (string) $tour->_id,
                    'title' => $tour->title,
                    'slug' => $tour->slug,
                    'destination' => $tour->destination,
                    'category' => $tour->category,
                    'duration_days' => $tour->duration_days,
                    'description' => $tour->description,
                    'images' => $tour->images ?? [],
                    'highlights' => $tour->highlights ?? [],
                    'itinerary' => $tour->itinerary ?? [],
                ],
                'departure' => [
                    'date' => $departureDate,
                    'status' => $departure['status'] ?? 'active',
                    'available_slots' => (int) ($departure['available_slots'] ?? 0),
                    'price_override' => $departure['price_override'] ?? null,
                ],
                'assignment_state' => $this->resolveAssignmentState($departureDate, $progressHistory),
                'latest_progress' => $progressHistory->last(),
                'guide_progress' => $progressHistory->all(),
                'statistics' => [
                    'total_pax' => (int) $bookings->sum('num_pax'),
                    'bookings_count' => $bookings->count(),
                    'confirmed_bookings' => $bookings->whereIn('status', ['confirmed', 'completed'])->count(),
                    'pending_bookings' => $bookings->where('status', 'pending')->count(),
                ],
                'passengers' => $bookings->flatMap(fn ($b) => 
                    collect($b->passengers ?? [])->map(fn ($p) => [
                        'name' => $p['name'] ?? null,
                        'dob' => $p['dob'] ?? null,
                        'passport' => $p['passport'] ?? null,
                        'booking_id' => (string) $b->_id,
                        'customer_name' => $b->user->name ?? null,
                        'customer_phone' => $b->user->phone ?? null,
                    ])
                )->values()->all(),
                'partners' => $partnerItems->all(),
            ];
        });

        return $this->apiResponse(true, $result->count() === 1 ? $result->first() : $result->all(), 
            'Lấy thông tin phân công thành công.');
    }

    /**
     * Xem danh sách thành viên trong đoàn (passengers)
     */
    public function passengers(Request $request, string $tourId, string $departureDate)
    {
        $guideId = (string) $request->user()->_id;

        $tour = Tour::find($tourId);
        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép xem danh sách này.', 403);
        }

        $bookings = Booking::where('tour_id', $tourId)
            ->with('user')
            ->get()
            ->filter(fn ($b) => optional($b->departure_date)->toDateString() === $departureDate);

        $passengers = $bookings->flatMap(fn ($b) => 
            collect($b->passengers ?? [])->map(fn ($p) => [
                'name' => $p['name'] ?? null,
                'dob' => $p['dob'] ?? null,
                'passport' => $p['passport'] ?? null,
                'booking_id' => (string) $b->_id,
                'customer' => [
                    'id' => (string) $b->user?->_id,
                    'name' => $b->user->name ?? null,
                    'phone' => $b->user->phone ?? null,
                    'email' => $b->user->email ?? null,
                ],
                'special_requirements' => $b->special_requirements ?? [],
                'note' => $b->note,
            ])
        )->values();

        return $this->apiResponse(true, [
            'tour_id' => (string) $tour->_id,
            'tour_title' => $tour->title,
            'departure_date' => $departureDate,
            'total_passengers' => $passengers->count(),
            'passengers' => $passengers->all(),
        ], 'Lấy danh sách thành viên đoàn thành công.');
    }

    /**
     * Xem danh sách đối tác đi kèm (dịch vụ)
     */
    public function partners(Request $request, string $tourId)
    {
        $guideId = (string) $request->user()->_id;

        $tour = Tour::find($tourId);
        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép xem danh sách này.', 403);
        }

        $partnerIds = collect($tour->linked_partner_ids ?? [])->map(fn ($id) => (string) $id)->filter()->unique();
        
        if ($partnerIds->isEmpty()) {
            return $this->apiResponse(true, [
                'tour_id' => (string) $tour->_id,
                'partners' => [],
            ], 'Tour không có đối tác liên kết.');
        }

        $partners = Partner::whereIn('_id', $partnerIds->all())->get();

        $partnerList = $partners->map(fn ($partner) => [
            'id' => (string) $partner->_id,
            'company_name' => $partner->company_name,
            'service_type' => $partner->service_type,
            'contact_info' => $partner->contact_info ?? [],
            'address' => $partner->address,
            'notes' => $partner->notes,
        ]);

        return $this->apiResponse(true, [
            'tour_id' => (string) $tour->_id,
            'partners' => $partnerList->all(),
        ], 'Lấy danh sách đối tác thành công.');
    }

    /**
     * Cập nhật tiến trình tour (điểm danh, báo cáo, chuyển trạng thái)
     */
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
            'incident_description' => $request->input('incident_description'),
            'day_note' => $request->input('day_note'),
            'day_number' => (int) $request->input('day_number', 1),
            'location' => $request->input('location'),
            'weather' => $request->input('weather'),
            'attendance' => collect($request->input('attendance', []))
                ->map(fn ($item) => [
                    'name' => $item['name'] ?? null,
                    'present' => (bool) ($item['present'] ?? false),
                    'note' => $item['note'] ?? null,
                ])
                ->values()
                ->all(),
            'images' => collect($request->file('image_files', []))
                ->map(function ($file) {
                    return Storage::url($file->store('guide-progress', 'public'));
                })
                ->values()
                ->all(),
            'updated_by' => $guideId,
            'updated_at' => Carbon::now()->toISOString(),
        ];

        $tour->guide_progress = $progress;
        $tour->save();

        // Nếu hoàn thành tour, cập nhật bookings
        if ($request->string('status')->toString() === 'completed' && $request->filled('departure_date')) {
            $departureDate = Carbon::parse($request->input('departure_date'))->toDateString();

            Booking::where('tour_id', $tour->_id)
                ->whereIn('status', ['pending', 'confirmed', 'in_progress'])
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

    /**
     * Điểm danh khách theo departure
     */
    public function takeAttendance(Request $request, string $tourId, string $departureDate)
    {
        $guideId = (string) $request->user()->_id;
        $validated = $request->validate([
            'attendance' => ['required', 'array'],
            'attendance.*.name' => ['required', 'string', 'max:255'],
            'attendance.*.present' => ['required', 'boolean'],
            'attendance.*.note' => ['nullable', 'string', 'max:500'],
            'day_number' => ['required', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $tour = Tour::find($tourId);
        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép điểm danh tour này.', 403);
        }

        $progress = $tour->guide_progress ?? [];
        
        // Tìm progress cũ của departure này và cập nhật attendance
        $existingIndex = null;
        foreach ($progress as $index => $item) {
            if (($item['departure_date'] ?? null) === $departureDate && 
                ($item['day_number'] ?? 0) === $validated['day_number']) {
                $existingIndex = $index;
                break;
            }
        }

        $attendanceData = [
            'status' => 'boarding',
            'departure_date' => $departureDate,
            'day_number' => $validated['day_number'],
            'location' => $validated['location'] ?? null,
            'attendance' => collect($validated['attendance'])
                ->map(fn ($item) => [
                    'name' => $item['passenger_name'],
                    'present' => (bool) $item['present'],
                    'note' => $item['note'] ?? null,
                ])
                ->values()
                ->all(),
            'updated_by' => $guideId,
            'updated_at' => Carbon::now()->toISOString(),
        ];

        if ($existingIndex !== null) {
            $progress[$existingIndex] = array_merge($progress[$existingIndex], $attendanceData);
        } else {
            $progress[] = $attendanceData;
        }

        $tour->guide_progress = $progress;
        $tour->save();

        // Nếu đây là lần điểm danh đầu tiên, cập nhật status booking
        if ($existingIndex === null) {
            Booking::where('tour_id', $tour->_id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->get()
                ->filter(function (Booking $booking) use ($departureDate) {
                    return optional($booking->departure_date)->toDateString() === $departureDate;
                })
                ->each(function (Booking $booking) {
                    $booking->status = 'in_progress';
                    $booking->save();
                });
        }

        ActivityLog::create([
            'user_id' => $guideId,
            'action' => 'guide_attendance_taken',
            'module' => 'guide',
            'detail' => [
                'tour_id' => (string) $tour->_id,
                'departure_date' => $departureDate,
                'day_number' => $validated['day_number'],
                'total_present' => collect($validated['attendance'])->where('present', true)->count(),
                'total_absent' => collect($validated['attendance'])->where('present', false)->count(),
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, [
            'tour_id' => (string) $tour->_id,
            'departure_date' => $departureDate,
            'day_number' => $validated['day_number'],
            'attendance' => $attendanceData['attendance'],
        ], 'Điểm danh thành công.');
    }

    /**
     * Báo cáo sự cố trong tour
     */
    public function reportIncident(Request $request, string $tourId)
    {
        $guideId = (string) $request->user()->_id;
        $validated = $request->validate([
            'incident_type' => ['required', 'string', 'in:medical,transportation,accommodation,weather,security,other'],
            'incident_description' => ['required', 'string', 'max:2000'],
            'severity' => ['required', 'string', 'in:low,medium,high,critical'],
            'departure_date' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'affected_passengers' => ['nullable', 'array'],
            'affected_passengers.*' => ['string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string', 'max:500'],
        ]);

        $tour = Tour::find($tourId);
        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép báo cáo sự cố cho tour này.', 403);
        }

        // Lưu vào guide_progress
        $progress = $tour->guide_progress ?? [];
        $progress[] = [
            'status' => 'issue',
            'incident_type' => $validated['incident_type'],
            'incident_description' => $validated['incident_description'],
            'severity' => $validated['severity'],
            'departure_date' => $validated['departure_date'] ?? null,
            'location' => $validated['location'] ?? null,
            'affected_passengers' => $validated['affected_passengers'] ?? [],
            'images' => $validated['images'] ?? [],
            'updated_by' => $guideId,
            'updated_at' => Carbon::now()->toISOString(),
        ];

        $tour->guide_progress = $progress;
        $tour->save();

        // Gửi email thông báo cho admin/tour_manager nếu sự cố nghiêm trọng
        if (in_array($validated['severity'], ['high', 'critical'])) {
            Log::info('Critical incident reported by guide.', [
                'tour_id' => (string) $tour->_id,
                'tour_title' => $tour->title,
                'guide_id' => $guideId,
                'incident_type' => $validated['incident_type'],
                'severity' => $validated['severity'],
                'description' => $validated['incident_description'],
            ]);
        }

        ActivityLog::create([
            'user_id' => $guideId,
            'action' => 'guide_incident_reported',
            'module' => 'guide',
            'detail' => [
                'tour_id' => (string) $tour->_id,
                'incident_type' => $validated['incident_type'],
                'severity' => $validated['severity'],
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, [
            'tour_id' => (string) $tour->_id,
            'incident_type' => $validated['incident_type'],
            'severity' => $validated['severity'],
        ], 'Báo cáo sự cố thành công.');
    }

    /**
     * Gửi ghi chú cuối ngày cho quản lý tour
     */
    public function submitDayNote(Request $request, string $tourId)
    {
        $guideId = (string) $request->user()->_id;
        $validated = $request->validate([
            'departure_date' => ['required', 'date'],
            'day_number' => ['required', 'integer', 'min:1'],
            'day_note' => ['required', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:255'],
            'weather' => ['nullable', 'string', 'max:100'],
            'highlights' => ['nullable', 'array'],
            'highlights.*' => ['string', 'max:500'],
        ]);

        $tour = Tour::find($tourId);
        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép gửi ghi chú cho tour này.', 403);
        }

        $progress = $tour->guide_progress ?? [];
        
        // Tìm progress cũ và cập nhật
        $existingIndex = null;
        foreach ($progress as $index => $item) {
            if (($item['departure_date'] ?? null) === $validated['departure_date'] && 
                ($item['day_number'] ?? 0) === $validated['day_number']) {
                $existingIndex = $index;
                break;
            }
        }

        $dayNoteData = [
            'day_number' => $validated['day_number'],
            'departure_date' => $validated['departure_date'],
            'location' => $validated['location'] ?? null,
            'weather' => $validated['weather'] ?? null,
            'day_note' => $validated['day_note'],
            'highlights' => $validated['highlights'] ?? [],
            'updated_by' => $guideId,
            'updated_at' => Carbon::now()->toISOString(),
        ];

        if ($existingIndex !== null) {
            $progress[$existingIndex] = array_merge($progress[$existingIndex], $dayNoteData);
        } else {
            $progress[] = $dayNoteData;
        }

        $tour->guide_progress = $progress;
        $tour->save();

        ActivityLog::create([
            'user_id' => $guideId,
            'action' => 'guide_day_note_submitted',
            'module' => 'guide',
            'detail' => [
                'tour_id' => (string) $tour->_id,
                'departure_date' => $validated['departure_date'],
                'day_number' => $validated['day_number'],
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, null, 'Gửi ghi chú cuối ngày thành công.');
    }

    /**
     * Xem lịch sử tiến trình tour
     */
    public function progressHistory(Request $request, string $tourId)
    {
        $guideId = (string) $request->user()->_id;

        $tour = Tour::find($tourId);
        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        // Kiểm tra quyền
        $hasPermission = (string) ($tour->assigned_guide_id ?? '') === $guideId
            || collect($tour->departures ?? [])->contains(fn ($departure) => (string) ($departure['assigned_guide_id'] ?? '') === $guideId);

        if (! $hasPermission) {
            return $this->apiResponse(false, null, 'Bạn không được phép xem lịch sử tour này.', 403);
        }

        $progressHistory = collect($tour->guide_progress ?? [])
            ->sortByDesc('updated_at')
            ->values();

        // Thống kê theo departure
        $departures = $progressHistory->groupBy('departure_date')->map(function ($items, $date) {
            return [
                'departure_date' => $date,
                'total_updates' => $items->count(),
                'last_update' => $items->first()['updated_at'] ?? null,
                'statuses' => $items->pluck('status')->unique()->values()->all(),
                'has_incidents' => $items->contains(fn ($item) => ($item['status'] ?? '') === 'issue'),
            ];
        });

        return $this->apiResponse(true, [
            'tour_id' => (string) $tour->_id,
            'tour_title' => $tour->title,
            'total_updates' => $progressHistory->count(),
            'history' => $progressHistory->all(),
            'departure_summary' => $departures->values(),
        ], 'Lấy lịch sử tiến trình thành công.');
    }

    /**
     * Nhận thông báo đổi lịch (từ admin/tour_manager)
     * Endpoint này để guide xem các thông báo thay đổi lịch
     */
    public function notifications(Request $request)
    {
        $guideId = (string) $request->user()->_id;

        // Lấy các tour được phân công
        $allTours = $this->getAssignedTours($guideId);

        $tourIds = $allTours->pluck('_id')->all();

        // Tìm các activity logs liên quan đến thay đổi lịch
        $notifications = ActivityLog::whereIn('action', [
            'guide_assignment_changed',
            'tour_schedule_updated',
            'departure_date_changed',
        ])
        ->where(function ($query) use ($tourIds) {
            // Tìm logs có liên quan đến guide this
            return $query->whereIn('detail->tour_id', array_map(fn ($id) => (string) $id, $tourIds));
        })
        ->orderByDesc('created_at')
        ->limit(20)
        ->get()
        ->map(fn ($log) => [
            'id' => (string) $log->_id,
            'action' => $log->action,
            'message' => $this->formatNotificationMessage($log),
            'detail' => $log->detail ?? [],
            'created_at' => $log->created_at,
        ]);

        return $this->apiResponse(true, [
            'notifications' => $notifications->all(),
            'unread_count' => $notifications->count(), // Có thể mở rộng thêm unread tracking
        ], 'Lấy thông báo thành công.');
    }

    /**
     * Thống kê cá nhân của guide
     */
    public function personalStats(Request $request)
    {
        $guideId = (string) $request->user()->_id;
        $period = $request->input('period', 'month');

        $startDate = match($period) {
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        $endDate = match($period) {
            'day' => Carbon::now()->endOfDay(),
            'week' => Carbon::now()->endOfWeek(),
            'month' => Carbon::now()->endOfMonth(),
            'year' => Carbon::now()->endOfYear(),
            default => Carbon::now()->endOfMonth(),
        };

        // Lấy tours được phân công
        $tours = $this->getAssignedTours($guideId);

        $tourIds = $tours->pluck('_id')->all();

        // Thống kê bookings
        $bookings = Booking::whereIn('tour_id', $tourIds)
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->get();

        $totalPax = (int) $bookings->sum('num_pax');
        $completedTours = $bookings->where('status', 'completed')->groupBy('tour_id')->keys()->count();

        // Thống kê theo trạng thái
        $statusBreakdown = $bookings->groupBy('status')->map(fn ($items) => $items->count());

        return $this->apiResponse(true, [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'type' => $period,
            ],
            'stats' => [
                'total_tours' => $tours->count(),
                'completed_tours' => $completedTours,
                'total_pax_served' => $totalPax,
                'bookings' => [
                    'total' => $bookings->count(),
                    'completed' => $statusBreakdown->get('completed', 0),
                    'in_progress' => $statusBreakdown->get('in_progress', 0),
                    'confirmed' => $statusBreakdown->get('confirmed', 0),
                ],
            ],
        ], 'Lấy thống kê thành công.');
    }

    /**
     * Format thông báo từ activity log
     */
    private function formatNotificationMessage(ActivityLog $log): string
    {
        $messages = [
            'guide_assignment_changed' => 'Phân công hướng dẫn viên đã thay đổi',
            'tour_schedule_updated' => 'Lịch trình tour đã được cập nhật',
            'departure_date_changed' => 'Ngày khởi hành đã thay đổi',
        ];

        $action = $log->action ?? '';
        $detail = $log->detail ?? [];
        
        $baseMessage = $messages[$action] ?? 'Có thông báo mới';
        
        if (isset($detail['tour_title'])) {
            $baseMessage .= ': ' . ($detail['tour_title'] ?? '');
        }

        return $baseMessage;
    }

    /**
     * Xác định trạng thái của assignment
     */
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
