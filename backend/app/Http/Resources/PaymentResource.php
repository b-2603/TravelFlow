<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $booking = null;
        if (is_object($this->resource) && method_exists($this->resource, 'relationLoaded') && $this->resource->relationLoaded('booking')) {
            $booking = $this->resource->booking;
        }

        $payments = (is_object($booking) && method_exists($booking, 'relationLoaded') && $booking->relationLoaded('payments'))
            ? $booking->payments
            : collect();
        $paidTotal = (float) $payments->where('status', 'success')->sum('amount');
        $refundedTotal = (float) $payments->where('status', 'refunded')->sum('amount');
        $netPaid = max(0, $paidTotal - $refundedTotal);

        return [
            'id' => (string) $this->_id,
            'booking_id' => (string) $this->booking_id,
            'user_id' => (string) $this->user_id,
            'amount' => $this->amount,
            'method' => $this->method,
            'payment_scope' => $this->payment_scope,
            'status' => $this->status,
            'transaction_id' => $this->transaction_id,
            'bank_transaction_id' => $this->bank_transaction_id ?? null,
            'customer_note' => $this->customer_note ?? null,
            'accountant_note' => $this->accountant_note ?? null,
            'reference_payment_id' => $this->reference_payment_id ?? null,
            'customer_confirmed_at' => $this->customer_confirmed_at ? Carbon::parse($this->customer_confirmed_at)->toISOString() : null,
            'paid_at' => optional($this->paid_at)->toISOString(),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'booking' => $this->whenLoaded('booking', fn () => $booking ? [
                'id' => (string) $booking->_id,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'departure_date' => optional($booking->departure_date)->toDateString(),
                'num_pax' => $booking->num_pax,
                'total_price' => $booking->total_price,
                'tour' => (is_object($booking) && method_exists($booking, 'relationLoaded') && $booking->relationLoaded('tour') && $booking->tour) ? [
                    'id' => (string) $booking->tour->_id,
                    'title' => $booking->tour->title,
                    'slug' => $booking->tour->slug,
                    'destination' => $booking->tour->destination,
                ] : null,
                'user' => (is_object($booking) && method_exists($booking, 'relationLoaded') && $booking->relationLoaded('user') && $booking->user) ? [
                    'id' => (string) $booking->user->_id,
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                    'phone' => $booking->user->phone,
                ] : null,
                'payment_summary' => [
                    'paid_total' => $paidTotal,
                    'refunded_total' => $refundedTotal,
                    'net_paid' => $netPaid,
                ],
                'payment_lines' => $payments
                    ->whereIn('status', ['success', 'refunded'])
                    ->values()
                    ->map(fn ($payment) => [
                        'id' => (string) $payment->_id,
                        'amount' => (float) $payment->amount,
                        'method' => $payment->method,
                        'status' => $payment->status,
                        'transaction_id' => $payment->transaction_id,
                        'bank_transaction_id' => $payment->bank_transaction_id ?? null,
                        'paid_at' => optional($payment->paid_at)->toISOString(),
                    ]),
            ] : null),
        ];
    }
}
