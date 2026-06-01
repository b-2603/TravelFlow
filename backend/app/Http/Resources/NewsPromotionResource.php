<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class NewsPromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'type' => $this->type,
            'title' => $this->title,
            'summary' => $this->summary,
            'content' => $this->content,
            'tag' => $this->tag,
            'detail_sections' => $this->detail_sections ?? [],
            'key_highlights' => $this->key_highlights ?? [],
            'benefits' => $this->benefits ?? [],
            'conditions' => $this->conditions ?? [],
            'valid_from' => optional($this->valid_from)->toDateString(),
            'valid_until' => optional($this->valid_until)->toDateString(),
            'target_audience' => $this->target_audience ?? [],
            'applicable_tours' => $this->applicable_tours ?? [],
            'booking_channels' => $this->booking_channels ?? [],
            'faq' => $this->faq ?? [],
            'contact_info' => $this->contact_info ?? [],
            'related_links' => $this->related_links ?? [],
            'cover_image' => $this->cover_image
                ? (Str::startsWith((string) $this->cover_image, ['http://', 'https://']) ? $this->cover_image : url($this->cover_image))
                : null,
            'published_at' => optional($this->published_at)->toDateString(),
            'status' => $this->status,
            'created_by' => $this->created_by ? (string) $this->created_by : null,
            'updated_by' => $this->updated_by ? (string) $this->updated_by : null,
            'author' => $this->whenLoaded('author', fn () => [
                'id' => (string) $this->author->_id,
                'name' => $this->author->name,
                'role' => $this->author->role,
                'role_name_vi' => $this->author->role_name_vi,
            ]),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
