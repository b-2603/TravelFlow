<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\SystemSetting;
use App\Models\Tour;
use App\Services\EmailService;
use App\Services\TourDepartureService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(
        private readonly TourDepartureService $departureService,
        private readonly EmailService $emailService
    ) {
    }

    public function index(Request $request)
    {
        $query = Booking::where('user_id', $request->user()->_id)
            ->with(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])
            ->orderByDesc('created_at');

        if ($request->filled('status') && $request->string('status')->toString() !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        $bookings = $query->get();

        return $this->apiResponse(true, BookingResource::collection($bookings), 'Lấy danh sách booking thành công.');
    }

    public function store(StoreBookingRequest $request)
    {
        $tour = Tour::where('_id', $request->string('tour_id')->toString())
            ->whereNull('deleted_at')
            ->first();

        if (! $tour || $tour->status !== 'approved') {
            return $this->apiResponse(false, null, 'Tour hiện không thể đặt.', 404);
        }

        $numPax = (int) $request->input('num_pax');
        $passengers = $request->input('passengers', []);

        if (count($passengers) !== $numPax) {
            throw ValidationException::withMessages([
                'passengers' => ['Số lượng hành khách phải khớp với số khách đăng ký.'],
            ]);
        }

        $departureDate = Carbon::parse($request->input('departure_date'))->toDateString();
        $this->departureService->ensureDepartureHasSlots($tour, $departureDate, $numPax);
        $selectedDeparture = collect($tour->departures)->firstWhere('date', $departureDate);
        $unitPrice = $selectedDeparture['price_override'] ?? $tour->price_per_person;

        $originalTotal = (float) $unitPrice * $numPax;
        $pointsToUse = (int) ($request->input('points_to_use') ?? 0);
        $user = $request->user();

        if ($pointsToUse > 0) {
            if ((int) ($user->reward_points ?? 0) < $pointsToUse) {
                return $this->apiResponse(false, null, 'Số điểm bạn nhập lớn hơn điểm hiện có.', 422);
            }
            // Do not allow using more points than the original total price.
            $pointsToUse = min($pointsToUse, (int) floor($originalTotal));
            $user->useRewardPoints($pointsToUse);
        }

        $finalTotal = max(0.0, $originalTotal - $pointsToUse);

        $booking = Booking::create([
            'tour_id' => $tour->_id,
            'user_id' => $user->_id,
            'departure_date' => Carbon::parse($departureDate),
            'num_pax' => $numPax,
            'original_total_price' => $originalTotal,
            'total_price' => $finalTotal,
            'points_used' => $pointsToUse,
            'points_earned' => 0,
            'rewarded_at' => null,
            'status' => 'pending',
            'passengers' => $passengers,
            'note' => $request->input('note'),
            'payment_status' => 'unpaid',
        ]);

        $this->departureService->decrementSlots($tour, $departureDate, $numPax);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'booking_created',
            'module' => 'bookings',
            'detail' => [
                'booking_id' => (string) $booking->_id,
                'tour_id' => (string) $tour->_id,
                'original_total' => $originalTotal,
                'final_total' => $booking->total_price,
                'points_used' => $booking->points_used ?? 0,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(
            true,
            new BookingResource($booking->load(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])),
            'Tạo booking thành công.',
            201
        );
    }

    public function show(Request $request, string $id)
    {
        $booking = Booking::with(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        $isOwner = (string) $booking->user_id === (string) $request->user()->_id;
        $isStaff = in_array($request->user()->role, ['admin', 'accountant'], true);

        if (! $isOwner && ! $isStaff) {
            return $this->apiResponse(false, null, 'Bạn không có quyền xem booking này.', 403);
        }

        return $this->apiResponse(true, new BookingResource($booking), 'Lấy chi tiết booking thành công.');
    }

    public function update(UpdateBookingRequest $request, string $id)
    {
        $booking = Booking::with(['tour', 'payments'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->_id) {
            return $this->apiResponse(false, null, 'Bạn không có quyền chỉnh sửa booking này.', 403);
        }

        if (in_array($booking->status, ['cancelled', 'completed'], true)) {
            return $this->apiResponse(false, null, 'Booking đã hủy hoặc hoàn thành nên không thể chỉnh sửa.', 422);
        }

        $paidTotal = (float) Payment::where('booking_id', $booking->_id)->where('status', 'success')->sum('amount');
        if ($paidTotal > 0 || in_array($booking->payment_status, ['partial', 'paid'], true)) {
            return $this->apiResponse(false, null, 'Booking đã phát sinh thanh toán nên không thể chỉnh sửa hành khách.', 422);
        }

        // Only allow edits while still pending (before staff confirmation).
        if ($booking->status !== 'pending') {
            return $this->apiResponse(false, null, 'Chỉ có thể chỉnh sửa khi booking đang ở trạng thái chờ xác nhận.', 422);
        }

        $tour = $booking->tour;
        if (! $tour) {
            $tour = Tour::find($booking->tour_id);
        }

        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour của booking.', 404);
        }

        $passengers = $request->input('passengers', []);
        $newPax = count($passengers);
        $oldPax = (int) ($booking->num_pax ?? 0);
        $departureDate = optional($booking->departure_date)->toDateString();

        if (! $departureDate) {
            return $this->apiResponse(false, null, 'Booking thiếu ngày đi nên không thể chỉnh sửa.', 422);
        }

        $diff = $newPax - $oldPax;
        if ($diff > 0) {
            // Need extra slots.
            $this->departureService->decrementSlots($tour, $departureDate, $diff);
        } elseif ($diff < 0) {
            // Return unused slots.
            $this->departureService->incrementSlots($tour, $departureDate, abs($diff));
        }

        // Recompute total price based on the tour's selected departure price (if any).
        $selectedDeparture = collect($tour->departures ?? [])->firstWhere('date', $departureDate);
        $unitPrice = $selectedDeparture['price_override'] ?? $tour->price_per_person;
        $booking->total_price = (float) $unitPrice * $newPax;
        $booking->num_pax = $newPax;
        $booking->passengers = $passengers;
        $booking->note = $request->input('note');

        // Clear pending payments because the amount/content may no longer match after editing.
        Payment::where('booking_id', $booking->_id)->where('status', 'pending')->delete();
        $booking->payment_status = 'unpaid';

        $booking->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'booking_updated_by_customer',
            'module' => 'bookings',
            'detail' => ['booking_id' => (string) $booking->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(
            true,
            new BookingResource($booking->load(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])),
            'Đã cập nhật booking. Vui lòng tạo lại yêu cầu thanh toán theo lựa chọn của bạn.'
        );
    }

    public function document(Request $request, string $id)
    {
        $booking = Booking::with(['tour', 'user', 'assignedAgent', 'payments'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->_id && ! in_array($request->user()->role, ['admin', 'accountant'], true)) {
            return $this->apiResponse(false, null, 'Bạn không có quyền tải chứng từ này.', 403);
        }

        $issuedAt = Carbon::now();
        $paidAmount = (float) $booking->payments->where('status', 'success')->sum('amount');
        $pdf = Pdf::loadView('pdf.booking-invoice', [
            'booking' => $booking,
            'issuedAt' => $issuedAt,
            'paidAmount' => $paidAmount,
            'remainingAmount' => max(0, (float) $booking->total_price - $paidAmount),
            'paymentLines' => $booking->payments,
        ])->setPaper('a4');

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="booking-'.$booking->_id.'.pdf"',
        ]);
    }

    public function cancelPreview(Request $request, string $id)
    {
        $booking = Booking::with(['tour', 'user', 'payments', 'refundRequests'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->_id && $request->user()->role !== 'admin') {
            return $this->apiResponse(false, null, 'Bạn không có quyền xem thông tin hủy tour này.', 403);
        }

        $policy = $this->getCancellationPolicy();
        $preview = $this->buildCancellationPreview($booking, $policy);

        return $this->apiResponse(true, [
            'booking' => new BookingResource($booking),
            'policy' => $policy,
            'preview' => $preview,
        ], 'Lấy xem trước chính sách hủy tour thành công.');
    }

    public function cancel(Request $request, string $id)
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
            'refund_to_bank_name' => ['nullable', 'string', 'max:120'],
            'refund_to_account_number' => ['nullable', 'string', 'max:80'],
            'refund_to_account_name' => ['nullable', 'string', 'max:120'],
        ]);

        $booking = Booking::with(['tour', 'payments', 'refundRequests'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->_id && $request->user()->role !== 'admin') {
            return $this->apiResponse(false, null, 'Bạn không có quyền hủy booking này.', 403);
        }

        if (! in_array($booking->status, ['pending', 'confirmed'], true)) {
            return $this->apiResponse(false, null, 'Chỉ có thể hủy booking đang chờ xác nhận hoặc đã xác nhận.', 422);
        }

        $existingRefund = RefundRequest::where('booking_id', $booking->_id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingRefund) {
            return $this->apiResponse(false, null, 'Booking này đã có yêu cầu hoàn tiền đang xử lý.', 422);
        }

        $policy = $this->getCancellationPolicy();
        $preview = $this->buildCancellationPreview($booking, $policy);
        $preferredResolution = 'cash_refund';

        if (($preview['refund_amount'] ?? 0) > 0) {
            if (! $request->filled('refund_to_bank_name') || ! $request->filled('refund_to_account_number') || ! $request->filled('refund_to_account_name')) {
                return $this->apiResponse(false, null, 'Vui lòng nhập đầy đủ thông tin nhận hoàn tiền (ngân hàng, số tài khoản, chủ tài khoản).', 422);
            }
        }

        $booking->status = 'cancelled';

        if ($booking->tour) {
            $this->departureService->incrementSlots(
                $booking->tour,
                Carbon::parse($booking->departure_date)->toDateString(),
                (int) $booking->num_pax
            );
        }

        RefundRequest::create([
            'user_id' => $booking->user_id,
            'booking_id' => $booking->_id,
            'reason' => $request->string('reason')->toString(),
            'amount_requested' => $preview['refund_amount'],
            'preferred_resolution' => $preferredResolution,
            'resolution_note' => null,
            'refund_rate' => $preview['refund_rate'],
            'fee_amount' => $preview['fee_amount'],
            'days_before_departure' => $preview['days_before_departure'],
            'processing_days' => $preview['processing_days'],
            'policy_snapshot' => $preview['policy_rule'],
            'status' => 'pending',
            'admin_note' => $this->buildResolutionNote($preferredResolution, $preview),
            'refund_to_method' => 'bank',
            'refund_to_bank_name' => $request->input('refund_to_bank_name'),
            'refund_to_account_number' => $request->input('refund_to_account_number'),
            'refund_to_account_name' => $request->input('refund_to_account_name'),
        ]);

        $booking->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'booking_cancelled',
            'module' => 'bookings',
            'detail' => [
                'booking_id' => (string) $booking->_id,
                'refund_rate' => $preview['refund_rate'],
                'refundable_amount' => $preview['refund_amount'],
                'preferred_resolution' => $preferredResolution,
                'refund_to_bank_name' => $request->input('refund_to_bank_name'),
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        if ($request->user()->email) {
            $this->emailService->sendBookingConfirmation($request->user()->email, [
                'booking_id' => (string) $booking->_id,
                'type' => 'cancellation',
                'refund_rate' => $preview['refund_rate'],
                'refundable_amount' => $preview['refund_amount'],
                'preferred_resolution' => $preferredResolution,
            ]);
        }

        return $this->apiResponse(
            true,
            new BookingResource($booking->load(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])),
            'Hủy booking thành công. Yêu cầu xử lý sau hủy đã được ghi nhận.'
        );
    }

    public function adminIndex(Request $request)
    {
        $query = Booking::with(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->string('payment_status')->toString());
        }

        $bookings = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => BookingResource::collection($bookings->getCollection()),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ], 'Lấy danh sách booking quản trị thành công.');
    }

    public function confirm(Request $request, string $id)
    {
        $booking = Booking::with(['tour', 'user', 'assignedAgent', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ($booking->status !== 'pending') {
            return $this->apiResponse(false, null, 'Chỉ có thể duyệt booking đang chờ xác nhận.', 422);
        }

        if (! in_array($booking->payment_status, ['partial', 'paid'], true)) {
            return $this->apiResponse(false, null, 'Chỉ có thể duyệt booking đã có thanh toán được xác nhận.', 422);
        }

        $booking->status = 'confirmed';
        $booking->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'booking_confirmed',
            'module' => 'bookings',
            'detail' => ['booking_id' => (string) $booking->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new BookingResource($booking), 'Duyệt booking thành công.');
    }

    private function getCancellationPolicy(): array
    {
        $settings = SystemSetting::first();
        $policy = $settings?->cancellation_policy;

        if (is_array($policy) && ! empty($policy['tiers'])) {
            return $policy;
        }

        return [
            'tiers' => [
                [
                    'key' => 'flex_15_plus',
                    'label' => 'Hủy trước 15+ ngày',
                    'min_days' => 15,
                    'max_days' => null,
                    'refund_rate' => 1.0,
                    'fee_rate' => 0.0,
                    'processing_days' => [3, 5],
                    'refund_text' => 'Hoàn 100%, miễn phí hoàn toàn',
                    'extra_note' => 'Nhận tiền về trong 3–5 ngày làm việc',
                ],
                [
                    'key' => 'care_7_14',
                    'label' => 'Hủy trước 7–14 ngày',
                    'min_days' => 7,
                    'max_days' => 14,
                    'refund_rate' => 0.7,
                    'fee_rate' => 0.3,
                    'processing_days' => [5, 7],
                    'refund_text' => 'Hoàn 70%, công ty giữ lại 30% làm phí hủy',
                ],
                [
                    'key' => 'late_3_6',
                    'label' => 'Hủy trước 3–6 ngày',
                    'min_days' => 3,
                    'max_days' => 6,
                    'refund_rate' => 0.5,
                    'fee_rate' => 0.5,
                    'processing_days' => [5, 7],
                    'refund_text' => 'Hoàn 50%, công ty đã đặt cọc nhiều dịch vụ',
                ],
                [
                    'key' => 'urgent_0_2',
                    'label' => 'Hủy trong 0–2 ngày',
                    'min_days' => 0,
                    'max_days' => 2,
                    'refund_rate' => 0.0,
                    'fee_rate' => 1.0,
                    'processing_days' => [0, 0],
                    'refund_text' => 'Không hoàn tiền mặt',
                    'extra_note' => 'Có thể dời ngày 1 lần miễn phí',
                ],
            ],
            'alternatives' => [
                ['key' => 'reschedule', 'label' => 'Dời ngày khởi hành'],
                ['key' => 'change_tour', 'label' => 'Đổi sang tour tương đương'],
                ['key' => 'voucher', 'label' => 'Nhận voucher bảo lưu 12 tháng'],
            ],
        ];
    }

    private function buildCancellationPreview(Booking $booking, array $policy): array
    {
        $paidTotal = (float) Payment::where('booking_id', $booking->_id)
            ->where('status', 'success')
            ->sum('amount');

        $baseAmount = $paidTotal > 0 ? $paidTotal : (float) $booking->total_price;
        $departureDate = Carbon::parse($booking->departure_date)->startOfDay();
        $daysBeforeDeparture = max(0, Carbon::today()->diffInDays($departureDate, false));
        $rule = collect($policy['tiers'] ?? [])->first(function ($tier) use ($daysBeforeDeparture) {
            $min = (int) ($tier['min_days'] ?? 0);
            $max = $tier['max_days'] ?? null;

            if ($daysBeforeDeparture < $min) {
                return false;
            }

            return $max === null || $daysBeforeDeparture <= (int) $max;
        }) ?? collect($policy['tiers'] ?? [])->last();

        $refundRate = (float) ($rule['refund_rate'] ?? 0);
        $feeRate = (float) ($rule['fee_rate'] ?? (1 - $refundRate));

        return [
            'days_before_departure' => $daysBeforeDeparture,
            'base_amount' => $baseAmount,
            'refund_rate' => $refundRate,
            'fee_rate' => $feeRate,
            'refund_amount' => round($baseAmount * $refundRate, 2),
            'fee_amount' => round($baseAmount * $feeRate, 2),
            'processing_days' => $rule['processing_days'] ?? [3, 5],
            'policy_rule' => $rule,
            'alternatives' => $policy['alternatives'] ?? [],
        ];
    }

    private function buildResolutionNote(string $preferredResolution, array $preview): string
    {
        return match ($preferredResolution) {
            'cash_refund' => sprintf('Khách hủy tour. Hoàn dự kiến %.0f%%, phí hủy %.0f%%.', $preview['refund_rate'] * 100, $preview['fee_rate'] * 100),
            'reschedule' => 'Khách chọn dời ngày khởi hành 1 lần miễn phí.',
            'change_tour' => 'Khách chọn đổi sang tour tương đương.',
            'voucher' => 'Khách chọn nhận voucher bảo lưu.',
            default => 'Khách gửi yêu cầu xử lý sau hủy tour.',
        };
    }
}
