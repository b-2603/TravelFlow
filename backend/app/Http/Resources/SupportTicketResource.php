<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'user_id' => (string) $this->user_id,
            'booking_id' => $this->booking_id ? (string) $this->booking_id : null,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status,
            'reply' => $this->reply,
            'handled_at' => optional($this->handled_at)->toISOString(),
            'handled_by' => $this->handled_by ? (string) $this->handled_by : null,
            'handler' => $this->whenLoaded('handledBy', fn () => $this->handledBy ? [
                'id' => (string) $this->handledBy->_id,
                'name' => $this->handledBy->name,
                'role' => $this->handledBy->role,
                'role_name_vi' => $this->handledBy->role_name_vi,
            ] : null),
            'booking' => $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => (string) $this->booking->_id,
                'departure_date' => optional($this->booking->departure_date)->toDateString(),
                'status' => $this->booking->status,
                'tour' => $this->booking->relationLoaded('tour') && $this->booking->tour ? [
                    'id' => (string) $this->booking->tour->_id,
                    'title' => $this->booking->tour->title,
                    'slug' => $this->booking->tour->slug,
                ] : null,
            ] : null),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
