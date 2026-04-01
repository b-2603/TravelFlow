<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'partner_id' => (string) $this->partner_id,
            'name' => $this->name,
            'service_category' => $this->service_category,
            'price' => $this->price,
            'unit' => $this->unit,
            'available_quantity' => $this->available_quantity,
            'pricing_note' => $this->pricing_note,
            'status' => $this->status,
            'cancellation_policy' => $this->cancellation_policy,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
