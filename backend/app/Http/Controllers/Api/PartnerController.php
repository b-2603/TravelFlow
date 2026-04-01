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
    public function services(Request $request)
    {
        $partner = Partner::where('user_id', $request->user()->_id)->first();

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy hồ sơ đối tác.', 404);
        }

        $services = PartnerService::where('partner_id', $partner->_id)
            ->orderByDesc('created_at')
            ->get();

        $linkedTours = Tour::whereNull('deleted_at')
            ->whereIn('linked_partner_ids', [(string) $partner->_id])
            ->with(['creator', 'guide'])
            ->get();

        $linkedTourIds = $linkedTours->pluck('_id')->all();
        $bookings = empty($linkedTourIds)
            ? collect()
            : Booking::with(['tour', 'user'])
                ->whereIn('tour_id', $linkedTourIds)
                ->orderByDesc('created_at')
                ->get();

        $successfulPayments = Payment::where('status', 'success')->count();
        $monthlyRevenue = (float) Payment::where('status', 'success')
            ->where('paid_at', '>=', Carbon::now()->startOfMonth())
            ->sum('amount');

        return $this->apiResponse(true, [
            'profile' => $partner,
            'services' => PartnerServiceResource::collection($services),
            'linked_tours' => TourResource::collection($linkedTours),
            'service_orders' => $bookings->map(function ($booking) {
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
                ];
            })->values(),
            'metrics' => [
                'successful_payments' => $successfulPayments,
                'monthly_revenue' => $monthlyRevenue,
                'linked_tours' => $linkedTours->count(),
                'service_orders' => $bookings->count(),
                'outstanding_orders' => $bookings->whereNotIn('status', ['completed', 'cancelled'])->count(),
            ],
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
}
