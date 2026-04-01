<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'user_id' => $this->user_id ? (string) $this->user_id : null,
            'action' => $this->action,
            'module' => $this->module,
            'detail' => $this->detail ?? [],
            'ip_address' => $this->ip_address,
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
