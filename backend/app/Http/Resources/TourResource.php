<?php

namespace App\Http\Resources;

use App\Models\Booking;
use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $linkedPartnerIds = collect($this->linked_partner_ids ?? [])
            ->filter()
            ->map(fn ($id) => (string) $id)
            ->values();

        $linkedPartners = $linkedPartnerIds->isEmpty()
            ? collect()
            : Partner::whereIn('_id', $linkedPartnerIds->all())->get(['_id', 'company_name', 'service_type']);

        $bookedPax = Booking::where('tour_id', $this->_id)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->sum('num_pax');

        $availableSlots = collect($this->departures ?? [])->sum(fn ($departure) => (int) ($departure['available_slots'] ?? 0));
        $capacity = $bookedPax + $availableSlots;
        $fillRate = $capacity > 0 ? round(($bookedPax / $capacity) * 100, 2) : 0;

        return [
            'id' => (string) $this->_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'destination' => $this->destination,
            'category' => $this->category,
            'pinned' => (bool) ($this->pinned ?? false),
            'duration_days' => $this->duration_days,
            'max_pax' => $this->max_pax,
            'price_per_person' => $this->price_per_person,
            'promotion_type' => $this->promotion_type ?: 'none',
            'promotion_value' => $this->promotion_value ?: 0,
            'effective_price' => $this->effectivePrice(),
            'images' => $this->images ?? [],
            'highlights' => $this->highlights ?? [],
            'itinerary' => $this->itinerary ?? [],
            'participation_conditions' => [
                'Mang theo CCCD hoặc hộ chiếu bản gốc khi khởi hành',
                'Có mặt trước giờ khởi hành ít nhất 30 phút',
                'Thông báo sớm nếu có ăn chay hoặc yêu cầu đặc biệt',
                'Trẻ em cần đi cùng người giám hộ hợp lệ',
            ],
            'status' => $this->status,
            'reject_reason' => $this->reject_reason,
            'departures' => collect($this->departures ?? [])->map(function ($departure) {
                return [
                    'date' => $departure['date'] ?? null,
                    'available_slots' => (int) ($departure['available_slots'] ?? 0),
                    'price_override' => $departure['price_override'] ?? null,
                    'status' => $departure['status'] ?? 'active',
                    'assigned_guide_id' => isset($departure['assigned_guide_id']) ? (string) $departure['assigned_guide_id'] : null,
                ];
            })->values()->all(),
            'linked_partner_ids' => $linkedPartnerIds->all(),
            'linked_partners' => $linkedPartners->map(fn ($partner) => [
                'id' => (string) $partner->_id,
                'company_name' => $partner->company_name,
                'service_type' => $partner->service_type,
            ])->values()->all(),
            'summary' => [
                'booked_pax' => (int) $bookedPax,
                'available_slots' => (int) $availableSlots,
                'fill_rate' => $fillRate,
            ],
            'created_by' => $this->created_by ? (string) $this->created_by : null,
            'assigned_guide_id' => $this->assigned_guide_id ? (string) $this->assigned_guide_id : null,
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => (string) $this->creator->_id,
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ]),
            'guide' => $this->whenLoaded('guide', fn () => $this->guide ? [
                'id' => (string) $this->guide->_id,
                'name' => $this->guide->name,
                'email' => $this->guide->email,
            ] : null),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }

    private function effectivePrice(): float
    {
        $basePrice = (float) $this->price_per_person;
        $promotionType = $this->promotion_type ?: 'none';
        $promotionValue = (float) ($this->promotion_value ?: 0);

        return match ($promotionType) {
            'percent' => max(0, $basePrice - (($basePrice * $promotionValue) / 100)),
            'fixed' => max(0, $basePrice - $promotionValue),
            default => $basePrice,
        };
    }
}
