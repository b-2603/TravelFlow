<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'tour_id' => (string) $this->tour_id,
            'user_id' => (string) $this->user_id,
            'assigned_agent_id' => $this->assigned_agent_id ? (string) $this->assigned_agent_id : null,
            'departure_date' => optional($this->departure_date)->toDateString(),
            'num_pax' => $this->num_pax,
            'total_price' => $this->total_price,
            'status' => $this->status,
            'passengers' => $this->passengers ?? [],
            'note' => $this->note,
            'internal_note' => $this->internal_note,
            'special_requirements' => $this->special_requirements ?? [],
            'payment_status' => $this->payment_status,
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'review' => $this->whenLoaded('review', fn () => $this->review ? new ReviewResource($this->review) : null),
            'refund_requests' => RefundRequestResource::collection($this->whenLoaded('refundRequests')),
            'support_tickets' => SupportTicketResource::collection($this->whenLoaded('supportTickets')),
            'tour' => $this->whenLoaded('tour', fn () => [
                'id' => (string) $this->tour->_id,
                'title' => $this->tour->title,
                'slug' => $this->tour->slug,
                'destination' => $this->tour->destination,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => (string) $this->user->_id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'username' => $this->user->username,
            ]),
            'assigned_agent' => $this->whenLoaded('assignedAgent', fn () => $this->assignedAgent ? [
                'id' => (string) $this->assignedAgent->_id,
                'name' => $this->assignedAgent->name,
                'email' => $this->assignedAgent->email,
            ] : null),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
