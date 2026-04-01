<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'tour_id' => (string) $this->tour_id,
            'user_id' => (string) $this->user_id,
            'booking_id' => $this->booking_id ? (string) $this->booking_id : null,
            'title' => $this->title,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'images' => collect($this->images ?? [])
                ->map(fn ($image) => Str::startsWith((string) $image, ['http://', 'https://']) ? $image : url($image))
                ->values()
                ->all(),
            'status' => $this->status,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => (string) $this->user->_id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar
                    ? (Str::startsWith((string) $this->user->avatar, ['http://', 'https://']) ? $this->user->avatar : url($this->user->avatar))
                    : null,
            ]),
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
