<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BankTransferWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $secret = (string) env('BANK_TRANSFER_WEBHOOK_SECRET', '');
        if ($secret !== '') {
            $provided = $request->header('X-Webhook-Secret')
                ?? $request->input('secret')
                ?? $request->query('secret');

            if (! hash_equals($secret, (string) $provided)) {
                return $this->apiResponse(false, null, 'Webhook secret không hợp lệ.', 401);
            }
        }

        $reference = $this->extractReference($request);
        $amount = $this->extractAmount($request);
        $paidAtInput = $this->extractPaidAt($request);
        $bankTransactionId = $this->extractBankTransactionId($request);
        $description = $this->extractDescription($request);

        $validator = Validator::make([
            'reference' => $reference,
            'amount' => $amount,
            'paid_at' => $paidAtInput,
            'bank_transaction_id' => $bankTransactionId,
            'description' => $description,
        ], [
            'reference' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['nullable', 'date'],
            'bank_transaction_id' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ], [
            'reference.required' => 'Không tìm thấy mã tham chiếu (PAY-...) trong payload webhook.',
        ]);

        if ($validator->fails()) {
            return $this->apiResponse(false, $validator->errors(), 'Dữ liệu webhook không hợp lệ.', 422);
        }

        $reference = (string) $reference;
        $amount = (float) $amount;

        $payment = Payment::where('transaction_id', $reference)->first();

        if (! $payment) {
            return $this->apiResponse(false, null, 'Không tìm thấy phiếu thanh toán.', 404);
        }

        if ($payment->method !== 'bank') {
            return $this->apiResponse(false, null, 'Webhook chỉ hỗ trợ thanh toán chuyển khoản.', 422);
        }

        if ($payment->status === 'success') {
            return $this->apiResponse(true, [
                'payment_id' => (string) $payment->_id,
                'booking_id' => (string) $payment->booking_id,
                'status' => $payment->status,
            ], 'Thanh toán đã được xác nhận trước đó.');
        }

        if ($payment->status !== 'pending') {
            return $this->apiResponse(false, null, 'Thanh toán này không còn ở trạng thái chờ xác nhận.', 422);
        }

        $expectedAmount = (float) ($payment->amount ?? 0);
        if (abs($expectedAmount - $amount) > 0.01) {
            return $this->apiResponse(false, [
                'expected_amount' => $expectedAmount,
                'received_amount' => $amount,
            ], 'Số tiền không khớp với phiếu thanh toán.', 422);
        }

        $paidAt = $paidAtInput ? Carbon::parse($paidAtInput) : Carbon::now();

        $payment->status = 'success';
        $payment->paid_at = $paidAt;
        $payment->save();

        $booking = Booking::find($payment->booking_id);
        if ($booking) {
            $this->syncBookingPaymentStatus($booking);
        }

        ActivityLog::create([
            'user_id' => null,
            'action' => 'payment_webhook_confirmed',
            'module' => 'payments',
            'detail' => [
                'payment_id' => (string) $payment->_id,
                'booking_id' => (string) $payment->booking_id,
                'reference' => $reference,
                'bank_transaction_id' => $bankTransactionId,
                'description' => $description,
                'amount' => $amount,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, [
            'payment_id' => (string) $payment->_id,
            'booking_id' => (string) $payment->booking_id,
            'status' => $payment->status,
        ], 'Đã xác nhận thanh toán qua webhook.');
    }

    private function syncBookingPaymentStatus(Booking $booking): void
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
    }

    private function extractDescription(Request $request): ?string
    {
        $value = $request->input('description')
            ?? $request->input('content')
            ?? $request->input('data.description')
            ?? $request->input('data.content')
            ?? $request->input('data.remark')
            ?? $request->input('data.memo');

        return $value !== null ? (string) $value : null;
    }

    private function extractReference(Request $request): ?string
    {
        $direct = $request->input('reference') ?? $request->input('data.reference');
        if ($direct) {
            return (string) $direct;
        }

        $description = $this->extractDescription($request) ?? '';
        if ($description === '') {
            return null;
        }

        if (preg_match('/\bPAY-[A-Z0-9]{12}\b/', strtoupper($description), $matches) === 1) {
            return $matches[0];
        }

        return null;
    }

    private function extractAmount(Request $request): ?float
    {
        $value = $request->input('amount')
            ?? $request->input('data.amount')
            ?? $request->input('data.transferAmount')
            ?? $request->input('data.transfer_amount')
            ?? $request->input('data.transactionAmount')
            ?? $request->input('data.transaction_amount');

        return $value !== null ? (float) $value : null;
    }

    private function extractPaidAt(Request $request): ?string
    {
        $value = $request->input('paid_at')
            ?? $request->input('data.paid_at')
            ?? $request->input('data.transactionDateTime')
            ?? $request->input('data.transaction_date_time')
            ?? $request->input('data.occurred_at')
            ?? $request->input('data.occurredAt');

        return $value !== null ? (string) $value : null;
    }

    private function extractBankTransactionId(Request $request): ?string
    {
        $value = $request->input('bank_transaction_id')
            ?? $request->input('data.bank_transaction_id')
            ?? $request->input('data.transactionId')
            ?? $request->input('data.transaction_id')
            ?? $request->input('data.tid');

        return $value !== null ? (string) $value : null;
    }
}
