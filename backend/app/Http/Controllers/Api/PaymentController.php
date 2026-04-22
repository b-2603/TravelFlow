<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RefundDecisionRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\RefundRequestResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Partner;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\Tour;
use App\Services\EmailService;
use App\Services\PaymentService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly EmailService $emailService
    ) {
    }

    public function index(Request $request)
    {
        $query = Payment::with(['booking.tour', 'user'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'pending') {
                $query->whereIn('status', ['pending', 'submitted']);
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('method')) {
            $query->where('method', $request->string('method')->toString());
        }

        if ($request->filled('booking_id')) {
            $query->where('booking_id', $request->string('booking_id')->toString());
        }

        if ($request->filled('transaction_id')) {
            $query->where('transaction_id', $request->string('transaction_id')->toString());
        }

        if ($request->filled('month')) {
            $start = Carbon::parse($request->string('month')->toString().'-01')->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $query->whereBetween('created_at', [$start, $end]);
        }

        $payments = $query->paginate(20);
        $collection = collect($payments->items());
        $successful = $collection->where('status', 'success');
        $refunded = $collection->where('status', 'refunded');

        return $this->apiResponse(true, [
            'items' => PaymentResource::collection($collection),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
            'summary' => [
                'total_amount' => (float) $collection->sum('amount'),
                'successful_amount' => (float) $successful->sum('amount'),
                'refunded_amount' => (float) $refunded->sum('amount'),
                'pending_count' => $collection->where('status', 'pending')->count(),
                'success_count' => $successful->count(),
                'refunded_count' => $refunded->count(),
            ],
        ], 'Lấy danh sách thanh toán thành công.');
    }

    public function store(StorePaymentRequest $request)
    {
        $booking = Booking::with(['tour', 'user'])->find($request->string('booking_id')->toString());

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->_id && ! in_array($request->user()->role, ['admin', 'accountant'], true)) {
            return $this->apiResponse(false, null, 'Bạn không có quyền thanh toán booking này.', 403);
        }

        $paymentScope = $request->string('payment_scope', 'full')->toString();
        $paidTotal = (float) Payment::where('booking_id', $booking->_id)->where('status', 'success')->sum('amount');
        $remaining = max(0, (float) $booking->total_price - $paidTotal);
        $depositRate = (float) env('BOOKING_DEPOSIT_RATE', 0.3);
        $expectedAmount = $paymentScope === 'deposit'
            ? round((float) $booking->total_price * $depositRate, 2)
            : $remaining;

        $amount = (float) ($request->input('amount') ?: $expectedAmount);

        if ($amount <= 0) {
            return $this->apiResponse(false, null, 'Số tiền thanh toán không hợp lệ.', 422);
        }

        if ($amount > $remaining && $remaining > 0) {
            $amount = $remaining;
        }

        $payment = Payment::create([
            'booking_id' => $booking->_id,
            'user_id' => $request->user()->_id,
            'amount' => $amount,
            'method' => $request->string('method')->toString(),
            'payment_scope' => $paymentScope,
            'status' => 'pending',
            'transaction_id' => $this->paymentService->createReference('PAY'),
            'paid_at' => null,
        ]);

        $this->syncBookingPaymentStatus($booking, $request, false);

        return $this->apiResponse(
            true,
            new PaymentResource($payment),
            'Đã tạo yêu cầu thanh toán. Vui lòng quét mã QR và chờ xác nhận chuyển khoản.',
            201
        );
    }

    public function show(Request $request, string $id)
    {
        $payment = Payment::with(['booking.tour', 'user'])->find($id);

        if (! $payment) {
            return $this->apiResponse(false, null, 'Không tìm thấy thanh toán.', 404);
        }

        if ((string) $payment->user_id !== (string) $request->user()->_id && ! in_array($request->user()->role, ['admin', 'accountant'], true)) {
            return $this->apiResponse(false, null, 'Bạn không có quyền xem thanh toán này.', 403);
        }

        return $this->apiResponse(true, new PaymentResource($payment), 'Lấy chi tiết thanh toán thành công.');
    }

    public function confirm(Request $request, string $id)
    {
        $payment = Payment::find($id);

        if (! $payment) {
            return $this->apiResponse(false, null, 'Không tìm thấy thanh toán.', 404);
        }

        if (! in_array($payment->status, ['pending', 'submitted'], true)) {
            return $this->apiResponse(false, null, 'Thanh toán này không còn ở trạng thái chờ xác nhận.', 422);
        }

        $request->validate([
            'paid_at' => ['nullable', 'date'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'bank_transaction_id' => ['nullable', 'string', 'max:120'],
            'accountant_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($request->filled('amount')) {
            $amount = (float) $request->input('amount');
            $original = (float) $payment->amount;
            if ($amount > $original + 0.01) {
                return $this->apiResponse(false, null, 'Số tiền xác nhận không được lớn hơn số tiền của phiếu thanh toán.', 422);
            }
            $payment->amount = $amount;
        }

        $payment->status = 'success';
        $payment->paid_at = $request->filled('paid_at') ? Carbon::parse($request->input('paid_at')) : Carbon::now();

        if ($request->filled('bank_transaction_id')) {
            $payment->bank_transaction_id = $request->string('bank_transaction_id')->toString();
        }
        if ($request->filled('accountant_note')) {
            $payment->accountant_note = $request->string('accountant_note')->toString();
        }
        $payment->save();

        $booking = Booking::with(['tour', 'user'])->find($payment->booking_id);
        if ($booking) {
            $this->syncBookingPaymentStatus($booking, $request, true);
        }

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'payment_confirmed',
            'module' => 'payments',
            'detail' => ['payment_id' => (string) $payment->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new PaymentResource($payment), 'Xác nhận thanh toán thành công.');
    }

    public function customerConfirm(Request $request, string $id)
    {
        $payment = Payment::find($id);

        if (! $payment) {
            return $this->apiResponse(false, null, 'Không tìm thấy thanh toán.', 404);
        }

        if ((string) $payment->user_id !== (string) $request->user()->_id && ! in_array($request->user()->role, ['admin', 'accountant'], true)) {
            return $this->apiResponse(false, null, 'Bạn không có quyền xác nhận thanh toán này.', 403);
        }

        if ($payment->method !== 'bank') {
            return $this->apiResponse(false, null, 'Chỉ hỗ trợ tự xác nhận cho chuyển khoản ngân hàng.', 422);
        }

        if (! in_array($payment->status, ['pending', 'submitted'], true)) {
            return $this->apiResponse(false, null, 'Thanh toán này không còn ở trạng thái chờ xác nhận.', 422);
        }

        $selfConfirmEnabled = (bool) env('PAYMENT_SELF_CONFIRM_ENABLED', false);

        if ($selfConfirmEnabled) {
            $payment->status = 'success';
            $payment->paid_at = Carbon::now();
            $payment->save();

            $booking = Booking::with(['tour', 'user'])->find($payment->booking_id);
            if ($booking) {
                $this->syncBookingPaymentStatus($booking, $request, true);
            }

            ActivityLog::create([
                'user_id' => $request->user()->_id,
                'action' => 'payment_self_confirmed',
                'module' => 'payments',
                'detail' => ['payment_id' => (string) $payment->_id],
                'ip_address' => $request->ip(),
                'created_at' => Carbon::now(),
            ]);

            return $this->apiResponse(true, new PaymentResource($payment), 'Đã ghi nhận thanh toán. Trạng thái booking đã được cập nhật.');
        }

        $payment->status = 'submitted';
        $payment->customer_confirmed_at = Carbon::now();
        if ($request->filled('customer_note')) {
            $payment->customer_note = $request->string('customer_note')->toString();
        }
        $payment->save();

        $booking = Booking::with(['tour', 'user'])->find($payment->booking_id);
        if ($booking) {
            $this->syncBookingPaymentStatus($booking, $request, false);
        }

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'payment_customer_notified',
            'module' => 'payments',
            'detail' => [
                'payment_id' => (string) $payment->_id,
                'customer_note' => $request->input('customer_note'),
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new PaymentResource($payment), 'Đã ghi nhận bạn đã chuyển khoản. Hệ thống sẽ cập nhật trạng thái sau khi đối soát giao dịch.');
    }

    public function refund(Request $request, string $id)
    {
        $payment = Payment::find($id);

        if (! $payment) {
            return $this->apiResponse(false, null, 'Không tìm thấy thanh toán.', 404);
        }

        if ($payment->status !== 'success') {
            return $this->apiResponse(false, null, 'Chỉ có thể hoàn tiền giao dịch đã thành công.', 422);
        }

        $refundPayment = Payment::create([
            'booking_id' => $payment->booking_id,
            'user_id' => $request->user()->_id,
            'amount' => (float) $payment->amount,
            'method' => 'refund',
            'payment_scope' => 'refund',
            'status' => 'refunded',
            'transaction_id' => $this->paymentService->createReference('REF'),
            'paid_at' => Carbon::now(),
        ]);

        $refundPayment->reference_payment_id = (string) $payment->_id;
        $refundPayment->save();

        $booking = Booking::find($payment->booking_id);
        if ($booking) {
            $this->syncBookingPaymentStatus($booking, $request, false);
        }

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'payment_refunded',
            'module' => 'payments',
            'detail' => [
                'payment_id' => (string) $payment->_id,
                'refund_payment_id' => (string) $refundPayment->_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new PaymentResource($refundPayment), 'Hoàn tiền thành công.');
    }

    public function refundRequests(Request $request)
    {
        $query = RefundRequest::with(['booking.tour', 'booking.user', 'booking.payments'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $refunds = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => RefundRequestResource::collection($refunds->getCollection()),
            'pagination' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
            ],
        ], 'Lấy danh sách yêu cầu hoàn tiền thành công.');
    }

    public function approveRefund(RefundDecisionRequest $request, string $id)
    {
        $refund = RefundRequest::with(['booking.tour', 'booking.user', 'booking.payments'])->find($id);

        if (! $refund) {
            return $this->apiResponse(false, null, 'Không tìm thấy yêu cầu hoàn tiền.', 404);
        }

        if ($refund->status !== 'pending') {
            return $this->apiResponse(false, null, 'Yêu cầu hoàn tiền này không còn ở trạng thái chờ duyệt.', 422);
        }

        $refund->status = 'approved';
        $refund->admin_note = $request->input('admin_note');
        $refund->save();

        return $this->apiResponse(true, new RefundRequestResource($refund), 'Đã duyệt yêu cầu hoàn tiền.');
    }

    public function rejectRefund(RefundDecisionRequest $request, string $id)
    {
        $refund = RefundRequest::with(['booking.tour', 'booking.user', 'booking.payments'])->find($id);

        if (! $refund) {
            return $this->apiResponse(false, null, 'Không tìm thấy yêu cầu hoàn tiền.', 404);
        }

        if ($refund->status !== 'pending') {
            return $this->apiResponse(false, null, 'Yêu cầu hoàn tiền này không còn ở trạng thái chờ duyệt.', 422);
        }

        $refund->status = 'rejected';
        $refund->admin_note = $request->input('admin_note');
        $refund->save();

        return $this->apiResponse(true, new RefundRequestResource($refund), 'Đã từ chối yêu cầu hoàn tiền.');
    }

    public function markRefunded(Request $request, string $id)
    {
        $request->validate([
            'admin_note' => ['nullable', 'string', 'max:1000'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'method' => ['nullable', 'string', 'max:50'],
            'bank_transaction_id' => ['nullable', 'string', 'max:120'],
            'refund_to_bank_name' => ['nullable', 'string', 'max:120'],
            'refund_to_account_number' => ['nullable', 'string', 'max:80'],
            'refund_to_account_name' => ['nullable', 'string', 'max:120'],
        ]);

        $refund = RefundRequest::with(['booking.tour', 'booking.user', 'booking.payments'])->find($id);

        if (! $refund) {
            return $this->apiResponse(false, null, 'Không tìm thấy yêu cầu hoàn tiền.', 404);
        }

        if ($refund->status !== 'approved') {
            return $this->apiResponse(false, null, 'Chỉ có thể xác nhận hoàn tiền cho yêu cầu đã được duyệt.', 422);
        }

        if ($refund->preferred_resolution !== 'cash_refund' || (float) $refund->amount_requested <= 0) {
            return $this->apiResponse(false, null, 'Yêu cầu này không phải hoàn tiền mặt hoặc số tiền hoàn không hợp lệ.', 422);
        }

        $booking = Booking::with(['payments'])->find($refund->booking_id);
        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking của yêu cầu hoàn tiền.', 404);
        }

        $paidTotal = (float) $booking->payments->where('status', 'success')->sum('amount');
        $refundedTotal = (float) $booking->payments->where('status', 'refunded')->sum('amount');
        $refundableMax = max(0, $paidTotal - $refundedTotal);

        $amount = (float) ($request->input('amount') ?: (float) $refund->amount_requested);
        if ($amount > $refundableMax) {
            $amount = $refundableMax;
        }

        if ($amount <= 0) {
            return $this->apiResponse(false, null, 'Không còn số tiền hợp lệ để hoàn cho booking này.', 422);
        }

        $refundPayment = Payment::create([
            'booking_id' => $booking->_id,
            'user_id' => $request->user()->_id,
            'amount' => $amount,
            'method' => $request->string('method', 'refund')->toString(),
            'payment_scope' => 'refund',
            'status' => 'refunded',
            'transaction_id' => $this->paymentService->createReference('REF'),
            'paid_at' => Carbon::now(),
        ]);

        if ($request->filled('bank_transaction_id')) {
            $refundPayment->bank_transaction_id = $request->string('bank_transaction_id')->toString();
            $refundPayment->save();
        }

        $refund->status = 'refunded';
        $refund->admin_note = $request->input('admin_note') ?? $refund->admin_note;
        $refund->refunded_amount = $amount;
        $refund->refunded_at = Carbon::now();
        if ($request->filled('method')) {
            $refund->refund_to_method = $request->string('method')->toString();
        }
        if ($request->filled('refund_to_bank_name')) {
            $refund->refund_to_bank_name = $request->string('refund_to_bank_name')->toString();
        }
        if ($request->filled('refund_to_account_number')) {
            $refund->refund_to_account_number = $request->string('refund_to_account_number')->toString();
        }
        if ($request->filled('refund_to_account_name')) {
            $refund->refund_to_account_name = $request->string('refund_to_account_name')->toString();
        }
        $refund->save();

        $this->syncBookingPaymentStatus($booking, $request, false);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'refund_completed',
            'module' => 'refunds',
            'detail' => [
                'refund_request_id' => (string) $refund->_id,
                'booking_id' => (string) $booking->_id,
                'refund_payment_id' => (string) $refundPayment->_id,
                'amount' => $amount,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new RefundRequestResource($refund->load(['booking.tour', 'booking.user', 'booking.payments'])), 'Đã xác nhận hoàn tiền và cập nhật trạng thái booking.');
    }

    public function partnerLiabilities()
    {
        $items = $this->buildPartnerLiabilities();

        return $this->apiResponse(true, [
            'items' => $items,
            'summary' => [
                'total_payable' => (float) $items->sum('payable_amount'),
                'total_outstanding' => (float) $items->sum('outstanding_amount'),
            ],
        ], 'Lấy công nợ đối tác thành công.');
    }

    public function financeReport(Request $request)
    {
        $month = $request->string('month', Carbon::now()->format('Y-m'))->toString();
        $data = $this->buildFinanceReportData($month);

        return $this->apiResponse(true, [
            'month' => $data['month'],
            'summary' => $data['summary'],
        ], 'Lấy báo cáo tài chính thành công.');
    }

    public function exportFinanceReport(Request $request)
    {
        $month = $request->string('month', Carbon::now()->format('Y-m'))->toString();
        $format = $request->string('format', 'csv')->lower()->toString();
        $data = $this->buildFinanceReportData($month);

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('pdf.finance-report', [
                'month' => $data['month'],
                'summary' => $data['summary'],
                'liabilities' => $data['liabilities'],
                'generatedAt' => Carbon::now(),
            ])->setPaper('a4');

            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="bao-cao-tai-chinh-'.$month.'.pdf"',
            ]);
        }

        $rows = [
            ['Bao cao tai chinh', $month],
            ['Ngay xuat', Carbon::now()->format('d/m/Y H:i')],
            [],
            ['Chi so', 'Gia tri'],
            ['Doanh thu', $data['summary']['revenue']],
            ['Hoan tien', $data['summary']['refund_total']],
            ['Chi phi doi tac', $data['summary']['service_cost']],
            ['Loi nhuan uoc tinh', $data['summary']['profit']],
            ['So booking', $data['summary']['bookings_count']],
            ['So yeu cau hoan tien', $data['summary']['refund_requests_count']],
            [],
            ['Cong no doi tac'],
            ['Cong ty', 'Loai dich vu', 'Don da xac nhan', 'Phai tra', 'Da tra', 'Con no'],
        ];

        foreach ($data['liabilities'] as $item) {
            $rows[] = [
                $item['company_name'],
                $item['service_type'],
                $item['confirmed_orders'],
                $item['payable_amount'],
                $item['paid_amount'],
                $item['outstanding_amount'],
            ];
        }

        $stream = fopen('php://temp', 'r+');
        foreach ($rows as $row) {
            fputcsv($stream, $row);
        }
        rewind($stream);
        $csv = "\xEF\xBB\xBF".(stream_get_contents($stream) ?: '');
        fclose($stream);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="bao-cao-tai-chinh-'.$month.'.csv"',
        ]);
    }

    private function buildFinanceReportData(string $month): array
    {
        $start = Carbon::parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $payments = Payment::whereBetween('created_at', [$start, $end])->get();
        $bookings = Booking::whereBetween('created_at', [$start, $end])->get();
        $refunds = RefundRequest::whereBetween('created_at', [$start, $end])->get();
        $liabilities = $this->buildPartnerLiabilities();

        $revenue = (float) $payments->where('status', 'success')->sum('amount');
        $refundTotal = (float) $payments->where('status', 'refunded')->sum('amount');
        $serviceCost = (float) $liabilities->sum('payable_amount');

        return [
            'month' => $month,
            'summary' => [
                'revenue' => $revenue,
                'refund_total' => $refundTotal,
                'service_cost' => $serviceCost,
                'profit' => $revenue - $refundTotal - $serviceCost,
                'bookings_count' => $bookings->count(),
                'refund_requests_count' => $refunds->count(),
            ],
            'liabilities' => $liabilities->values()->all(),
        ];
    }

    private function buildPartnerLiabilities()
    {
        $partners = Partner::active()->get();

        return $partners->map(function ($partner) {
            $tourIds = Tour::whereIn('linked_partner_ids', [(string) $partner->_id])->pluck('_id');
            $bookings = $tourIds->isEmpty()
                ? collect()
                : Booking::whereIn('tour_id', $tourIds->all())->whereIn('status', ['confirmed', 'completed'])->get();

            $payable = (float) $bookings->sum(fn ($booking) => (float) $booking->total_price * 0.35);

            return [
                'partner_id' => (string) $partner->_id,
                'company_name' => $partner->company_name,
                'service_type' => $partner->service_type,
                'confirmed_orders' => $bookings->count(),
                'payable_amount' => $payable,
                'paid_amount' => 0,
                'outstanding_amount' => $payable,
            ];
        })->values();
    }

    private function syncBookingPaymentStatus(Booking $booking, Request $request, bool $sendConfirmationEmail): void
    {
        $successfulPayments = Payment::where('booking_id', $booking->_id)->where('status', 'success')->get();
        $refundPayments = Payment::where('booking_id', $booking->_id)->where('status', 'refunded')->get();
        $pendingPayments = Payment::where('booking_id', $booking->_id)->where('status', 'pending')->count();
        $submittedPayments = Payment::where('booking_id', $booking->_id)->where('status', 'submitted')->count();
        $paidTotal = (float) $successfulPayments->sum('amount');
        $refundedTotal = (float) $refundPayments->sum('amount');
        $netPaid = max(0, $paidTotal - $refundedTotal);

        if ($paidTotal > 0 && $refundedTotal >= $paidTotal - 0.01) {
            $booking->payment_status = 'refunded';
        } elseif ($netPaid >= (float) $booking->total_price && $booking->total_price > 0) {
            $booking->payment_status = 'paid';
        } elseif ($netPaid > 0) {
            $booking->payment_status = 'partial';
        } elseif (($pendingPayments + $submittedPayments) > 0) {
            $booking->payment_status = 'pending';
        } else {
            $booking->payment_status = 'unpaid';
        }

        if ($netPaid > 0 && $booking->status === 'pending') {
            $booking->status = 'confirmed';
        }

        $booking->save();

        if ($sendConfirmationEmail && $booking->user?->email) {
            $this->emailService->sendBookingConfirmation($booking->user->email, [
                'booking_id' => (string) $booking->_id,
                'tour' => $booking->tour?->title,
                'departure_date' => optional($booking->departure_date)->toDateString(),
                'payment_status' => $booking->payment_status,
            ]);

            ActivityLog::create([
                'user_id' => $request->user()?->_id,
                'action' => 'booking_confirmation_sent',
                'module' => 'emails',
                'detail' => ['booking_id' => (string) $booking->_id],
                'ip_address' => $request->ip(),
                'created_at' => Carbon::now(),
            ]);
        }
    }
}
