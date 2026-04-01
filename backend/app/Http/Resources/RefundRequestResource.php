<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RefundRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'user_id' => (string) $this->user_id,
            'booking_id' => (string) $this->booking_id,
            'reason' => $this->reason,
            'amount_requested' => $this->amount_requested,
            'preferred_resolution' => $this->preferred_resolution,
            'resolution_note' => $this->resolution_note,
            'refund_rate' => $this->refund_rate,
            'fee_amount' => $this->fee_amount,
            'days_before_departure' => $this->days_before_departure,
            'processing_days' => $this->processing_days,
            'policy_snapshot' => $this->policy_snapshot,
            'status' => $this->status,
            'admin_note' => $this->admin_note,
            'booking' => $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => (string) $this->booking->_id,
                'status' => $this->booking->status,
                'total_price' => $this->booking->total_price,
                'tour' => $this->booking->relationLoaded('tour') && $this->booking->tour ? [
                    'id' => (string) $this->booking->tour->_id,
                    'title' => $this->booking->tour->title,
                    'slug' => $this->booking->tour->slug,
                ] : null,
                'user' => $this->booking->relationLoaded('user') && $this->booking->user ? [
                    'id' => (string) $this->booking->user->_id,
                    'name' => $this->booking->user->name,
                    'email' => $this->booking->user->email,
                ] : null,
            ] : null),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
