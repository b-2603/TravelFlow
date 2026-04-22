<?php

namespace App\Http\Resources;

use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RefundRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payments = $this->booking && $this->booking->relationLoaded('payments')
            ? $this->booking->payments
            : collect();

        $paidTotal = (float) $payments->where('status', 'success')->sum('amount');
        $refundedTotal = (float) $payments->where('status', 'refunded')->sum('amount');
        $netPaid = max(0, $paidTotal - $refundedTotal);

        $baseAmount = $netPaid > 0
            ? $netPaid
            : (float) ($this->booking?->total_price ?? 0);

        $departureDate = $this->booking?->departure_date ? Carbon::parse($this->booking->departure_date)->startOfDay() : null;
        $cancelledAt = $this->created_at ? Carbon::parse($this->created_at)->startOfDay() : Carbon::today();
        $daysBeforeDeparture = $this->days_before_departure;
        if ($daysBeforeDeparture === null && $departureDate) {
            $daysBeforeDeparture = max(0, $cancelledAt->diffInDays($departureDate, false));
        }

        $refundRate = $this->refund_rate;
        $feeAmount = $this->fee_amount;
        $processingDays = $this->processing_days;

        if ($refundRate === null) {
            if ($this->amount_requested !== null && $baseAmount > 0) {
                $refundRate = min(1.0, max(0.0, (float) $this->amount_requested / $baseAmount));
            } else {
                $refundRate = (float) ($this->resolvePolicyRule($daysBeforeDeparture)['refund_rate'] ?? 0);
            }
        }

        $feeRate = 1 - (float) $refundRate;

        if ($feeAmount === null) {
            $feeAmount = round($baseAmount * $feeRate, 2);
        }

        if (! is_array($processingDays) || $processingDays === []) {
            $processingDays = $this->resolvePolicyRule($daysBeforeDeparture)['processing_days'] ?? [3, 5];
        }

        $amountRequested = $this->amount_requested;
        if ($amountRequested === null) {
            $amountRequested = round($baseAmount * (float) $refundRate, 2);
        }

        return [
            'id' => (string) $this->_id,
            'user_id' => (string) $this->user_id,
            'booking_id' => (string) $this->booking_id,
            'reason' => $this->reason,
            'amount_requested' => $amountRequested,
            'preferred_resolution' => $this->preferred_resolution,
            'resolution_note' => $this->resolution_note,
            'refund_rate' => (float) $refundRate,
            'fee_amount' => (float) $feeAmount,
            'days_before_departure' => $daysBeforeDeparture,
            'processing_days' => $processingDays,
            'policy_snapshot' => $this->policy_snapshot,
            'status' => $this->status,
            'admin_note' => $this->admin_note,
            'refunded_amount' => $this->refunded_amount ?? null,
            'refunded_at' => optional($this->refunded_at)->toISOString(),
            'refund_to' => [
                'method' => $this->refund_to_method ?? null,
                'bank_name' => $this->refund_to_bank_name ?? null,
                'account_number' => $this->refund_to_account_number ?? null,
                'account_name' => $this->refund_to_account_name ?? null,
            ],
            'booking' => $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => (string) $this->booking->_id,
                'status' => $this->booking->status,
                'departure_date' => optional($this->booking->departure_date)->toDateString(),
                'num_pax' => $this->booking->num_pax,
                'total_price' => $this->booking->total_price,
                'payment_status' => $this->booking->payment_status,
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
                        'paid_at' => optional($payment->paid_at)->toISOString(),
                    ]),
                'tour' => $this->booking->relationLoaded('tour') && $this->booking->tour ? [
                    'id' => (string) $this->booking->tour->_id,
                    'title' => $this->booking->tour->title,
                    'slug' => $this->booking->tour->slug,
                ] : null,
                'user' => $this->booking->relationLoaded('user') && $this->booking->user ? [
                    'id' => (string) $this->booking->user->_id,
                    'name' => $this->booking->user->name,
                    'email' => $this->booking->user->email,
                    'phone' => $this->booking->user->phone,
                ] : null,
            ] : null),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }

    private function resolvePolicyRule(?int $daysBeforeDeparture): array
    {
        $settings = SystemSetting::first();
        $policy = $settings?->cancellation_policy;

        if (! is_array($policy) || empty($policy['tiers'])) {
            $policy = [
                'tiers' => [
                    [
                        'key' => 'flex_15_plus',
                        'min_days' => 15,
                        'max_days' => null,
                        'refund_rate' => 1.0,
                        'fee_rate' => 0.0,
                        'processing_days' => [3, 5],
                    ],
                    [
                        'key' => 'care_7_14',
                        'min_days' => 7,
                        'max_days' => 14,
                        'refund_rate' => 0.7,
                        'fee_rate' => 0.3,
                        'processing_days' => [5, 7],
                    ],
                    [
                        'key' => 'late_3_6',
                        'min_days' => 3,
                        'max_days' => 6,
                        'refund_rate' => 0.5,
                        'fee_rate' => 0.5,
                        'processing_days' => [5, 7],
                    ],
                    [
                        'key' => 'urgent_0_2',
                        'min_days' => 0,
                        'max_days' => 2,
                        'refund_rate' => 0.0,
                        'fee_rate' => 1.0,
                        'processing_days' => [0, 0],
                    ],
                ],
            ];
        }

        $days = $daysBeforeDeparture ?? 0;

        $rule = collect($policy['tiers'] ?? [])->first(function ($tier) use ($days) {
            $min = (int) ($tier['min_days'] ?? 0);
            $max = $tier['max_days'] ?? null;

            if ($days < $min) {
                return false;
            }

            return $max === null || $days <= (int) $max;
        }) ?? collect($policy['tiers'] ?? [])->last();

        return is_array($rule) ? $rule : [];
    }
}
