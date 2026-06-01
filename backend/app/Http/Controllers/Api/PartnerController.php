<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartnerServiceRequest;
use App\Http\Requests\UpdatePartnerProfileRequest;
use App\Http\Resources\PartnerServiceResource;
use App\Http\Resources\TourResource;
use App\Models\Booking;
use App\Models\Partner;
use App\Models\PartnerService;
use App\Models\Payment;
use App\Models\Tour;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PartnerController extends Controller
{
    public function dashboard(Request $request)
    {
        $partner = Partner::with(['user'])->where('user_id', $request->user()->_id)->first();
        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $overview = $this->buildOverview($partner);

        return $this->apiResponse(true, $overview, 'Lấy tổng quan đối tác thành công.');
    }

    public function services(Request $request)
    {
        $partner = Partner::with(['user'])->where('user_id', $request->user()->_id)->first();
        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $overview = $this->buildOverview($partner);
        $services = collect($overview['services']);

        if ($request->filled('search')) {
            $search = mb_strtolower($request->string('search')->toString());
            $services = $services->filter(function ($service) use ($search) {
                $haystack = mb_strtolower(implode(' ', array_filter([
                    $service['name'] ?? '',
                    $service['service_category'] ?? '',
                    $service['pricing_note'] ?? '',
                ])));

                return str_contains($haystack, $search);
            })->values();
        }

        if ($request->filled('status')) {
            $services = $services->filter(fn ($service) => ($service['status'] ?? '') === $request->string('status')->toString())->values();
        }

        return $this->apiResponse(true, [
            ...$overview,
            'services' => $services->all(),
        ], 'Lấy dữ liệu đối tác thành công.');
    }

    public function updateProfile(UpdatePartnerProfileRequest $request)
    {
        $partner = Partner::where('user_id', $request->user()->_id)->first();

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $payload = $request->validated();
        $contactInfo = $payload['contact_info'] ?? [];

        if ($request->hasFile('business_license_file')) {
            $contactInfo['business_license'] = Storage::disk('public')->url(
                $request->file('business_license_file')->store('partner-documents', 'public')
            );
        }

        $existingFacilityImages = collect($contactInfo['facility_images'] ?? [])
            ->filter(fn ($item) => is_string($item) && filled(trim($item)))
            ->map(fn ($item) => trim($item));

        if ($request->hasFile('facility_image_files')) {
            $uploadedImages = collect($request->file('facility_image_files'))
                ->filter()
                ->map(fn ($file) => Storage::disk('public')->url($file->store('partner-facilities', 'public')));

            $contactInfo['facility_images'] = $existingFacilityImages->merge($uploadedImages)->values()->all();
        } else {
            $contactInfo['facility_images'] = $existingFacilityImages->values()->all();
        }

        $payload['contact_info'] = $contactInfo;
        unset($payload['business_license_file'], $payload['facility_image_files']);

        $partner->fill($payload);
        $partner->save();

        return $this->apiResponse(true, $partner, 'Cập nhật hồ sơ đối tác thành công.');
    }

    public function storeService(StorePartnerServiceRequest $request)
    {
        $partner = Partner::where('user_id', $request->user()->_id)->first();

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $service = PartnerService::create([
            ...$request->validated(),
            'partner_id' => $partner->_id,
            'status' => $request->input('status', 'active'),
        ]);

        return $this->apiResponse(true, new PartnerServiceResource($service), 'Tạo dịch vụ đối tác thành công.', 201);
    }

    public function updateService(StorePartnerServiceRequest $request, string $id)
    {
        $partner = Partner::where('user_id', $request->user()->_id)->first();

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $service = PartnerService::where('_id', $id)->where('partner_id', $partner->_id)->first();

        if (! $service) {
            return $this->apiResponse(false, null, 'Không tìm thấy dịch vụ đối tác.', 404);
        }

        $service->fill($request->validated());
        $service->save();

        return $this->apiResponse(true, new PartnerServiceResource($service), 'Cập nhật dịch vụ đối tác thành công.');
    }

    public function toggleServiceStatus(Request $request, string $id)
    {
        $partner = Partner::where('user_id', $request->user()->_id)->first();

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $service = PartnerService::where('_id', $id)->where('partner_id', $partner->_id)->first();

        if (! $service) {
            return $this->apiResponse(false, null, 'Không tìm thấy dịch vụ đối tác.', 404);
        }

        $service->status = $service->status === 'active' ? 'inactive' : 'active';
        $service->save();

        return $this->apiResponse(true, new PartnerServiceResource($service), 'Đã cập nhật trạng thái dịch vụ đối tác.');
    }

    public function deleteService(Request $request, string $id)
    {
        $partner = Partner::where('user_id', $request->user()->_id)->first();

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $service = PartnerService::where('_id', $id)->where('partner_id', $partner->_id)->first();

        if (! $service) {
            return $this->apiResponse(false, null, 'Không tìm thấy dịch vụ đối tác.', 404);
        }

        $service->delete();

        return $this->apiResponse(true, null, 'Đã xóa dịch vụ đối tác.');
    }

    private function buildOverview(Partner $partner): array
    {
        $services = PartnerService::where('partner_id', $partner->_id)
            ->orderByDesc('updated_at')
            ->get();

        $linkedTours = Tour::whereNull('deleted_at')
            ->with(['creator', 'guide'])
            ->get()
            ->filter(function ($tour) use ($partner) {
                return collect($tour->linked_partner_ids ?? [])
                    ->map(fn ($id) => (string) $id)
                    ->contains((string) $partner->_id);
            })
            ->sortByDesc('updated_at')
            ->values();

        $linkedTourIds = $linkedTours->pluck('_id')->all();
        $bookings = empty($linkedTourIds)
            ? collect()
            : Booking::with(['tour', 'user'])
                ->whereIn('tour_id', $linkedTourIds)
                ->orderByDesc('created_at')
                ->get();

        $successfulPayments = Payment::where('status', 'success')
            ->whereIn('booking_id', $bookings->pluck('_id')->all())
            ->get();
        $currentMonthPayments = $successfulPayments->filter(fn ($payment) => optional($payment->paid_at)->isCurrentMonth());
        $serviceStatuses = $services->groupBy('status')->map(fn ($items, $status) => [
            'status' => $status,
            'count' => $items->count(),
            'amount' => (float) $items->sum('price'),
        ])->values();
        $serviceCategories = $services->groupBy('service_category')->map(fn ($items, $category) => [
            'category' => $category,
            'count' => $items->count(),
            'active_count' => $items->where('status', 'active')->count(),
        ])->values();
        $recentOrders = $bookings->take(8)->map(fn ($booking) => $this->formatServiceOrder($booking));
        $recentLinkedTours = collect(TourResource::collection($linkedTours->take(8))->resolve())
            ->map(function (array $tour) {
                $summary = $tour['summary'] ?? [];

                return [
                    ...$tour,
                    'fill_rate' => $summary['fill_rate'] ?? 0,
                    'booked_pax' => $summary['booked_pax'] ?? 0,
                    'available_slots' => $summary['available_slots'] ?? 0,
                ];
            });

        return [
            'profile' => [
                'id' => (string) $partner->_id,
                'company_name' => $partner->company_name,
                'service_type' => $partner->service_type,
                'status' => $partner->status,
                'contact_info' => $partner->contact_info ?? [],
                'user' => $partner->user ? [
                    'id' => (string) $partner->user->_id,
                    'name' => $partner->user->name,
                    'email' => $partner->user->email,
                    'phone' => $partner->user->phone,
                ] : null,
                'created_at' => optional($partner->created_at)->toISOString(),
            ],
            'services' => PartnerServiceResource::collection($services)->resolve(),
            'linked_tours' => TourResource::collection($linkedTours)->resolve(),
            'service_orders' => $bookings->map(fn ($booking) => $this->formatServiceOrder($booking))->values()->all(),
            'metrics' => [
                'successful_payments' => $successfulPayments->count(),
                'monthly_revenue' => (float) $currentMonthPayments->sum('amount'),
                'linked_tours' => $linkedTours->count(),
                'service_orders' => $bookings->count(),
                'outstanding_orders' => $bookings->whereNotIn('status', ['completed', 'cancelled'])->count(),
                'active_services' => $services->where('status', 'active')->count(),
                'inactive_services' => $services->where('status', 'inactive')->count(),
            ],
            'breakdown' => [
                'service_statuses' => $serviceStatuses->all(),
                'service_categories' => $serviceCategories->all(),
            ],
            'recent_orders' => $recentOrders->all(),
            'recent_linked_tours' => $recentLinkedTours->all(),
            'profile_completion' => $this->calculateProfileCompletion($partner),
        ];
    }

    private function formatServiceOrder(Booking $booking): array
    {
        return [
            'id' => (string) $booking->_id,
            'tour' => $booking->tour ? [
                'id' => (string) $booking->tour->_id,
                'title' => $booking->tour->title,
                'destination' => $booking->tour->destination,
            ] : null,
            'customer' => $booking->user ? [
                'id' => (string) $booking->user->_id,
                'name' => $booking->user->name,
                'phone' => $booking->user->phone,
            ] : null,
            'departure_date' => optional($booking->departure_date)->toDateString(),
            'num_pax' => $booking->num_pax,
            'status' => $booking->status,
            'updated_at' => optional($booking->updated_at)->toISOString(),
        ];
    }

    private function calculateProfileCompletion(Partner $partner): int
    {
        $checks = [
            filled($partner->company_name),
            filled($partner->service_type),
            filled(data_get($partner->contact_info, 'contact_name')),
            filled(data_get($partner->contact_info, 'email')),
            filled(data_get($partner->contact_info, 'phone')),
            filled(data_get($partner->contact_info, 'address')),
            filled(data_get($partner->contact_info, 'business_license')),
        ];

        $completed = collect($checks)->filter()->count();

        return (int) round(($completed / count($checks)) * 100);
    }
}
