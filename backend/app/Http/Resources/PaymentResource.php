<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'booking_id' => (string) $this->booking_id,
            'user_id' => (string) $this->user_id,
            'amount' => $this->amount,
            'method' => $this->method,
            'payment_scope' => $this->payment_scope,
            'status' => $this->status,
            'transaction_id' => $this->transaction_id,
            'paid_at' => optional($this->paid_at)->toISOString(),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
