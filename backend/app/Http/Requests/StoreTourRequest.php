<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'destination' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:120'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'max_pax' => ['required', 'integer', 'min:1'],
            'price_per_person' => ['required', 'numeric', 'min:0'],
            'promotion_type' => ['nullable', 'in:none,percent,fixed'],
            'promotion_value' => ['nullable', 'numeric', 'min:0'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'image_files' => ['nullable', 'array'],
            'image_files.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'highlights' => ['nullable', 'array'],
            'highlights.*' => ['string'],
            'destination_overview' => ['nullable', 'string'],
            'historical_background' => ['nullable', 'string'],
            'local_culture' => ['nullable', 'array'],
            'local_culture.*' => ['string'],
            'best_time_to_visit' => ['nullable', 'string', 'max:255'],
            'weather_notes' => ['nullable', 'string'],
            'included_services' => ['nullable', 'array'],
            'included_services.*' => ['string'],
            'excluded_services' => ['nullable', 'array'],
            'excluded_services.*' => ['string'],
            'suitable_for' => ['nullable', 'array'],
            'suitable_for.*' => ['string'],
            'travel_tips' => ['nullable', 'array'],
            'travel_tips.*' => ['string'],
            'meeting_point' => ['nullable', 'string', 'max:255'],
            'itinerary' => ['nullable', 'array'],
            'itinerary.*.day' => ['required_with:itinerary', 'integer', 'min:1'],
            'itinerary.*.title' => ['required_with:itinerary', 'string', 'max:255'],
            'itinerary.*.description' => ['required_with:itinerary', 'string'],
            'linked_partner_ids' => ['nullable', 'array'],
            'linked_partner_ids.*' => ['string'],
            'departures' => ['required', 'array', 'min:1'],
            'departures.*.date' => ['required', 'date', 'after_or_equal:today'],
            'departures.*.available_slots' => ['required', 'integer', 'min:0'],
            'departures.*.price_override' => ['nullable', 'numeric', 'min:0'],
            'departures.*.status' => ['nullable', 'in:active,paused'],
            'departures.*.assigned_guide_id' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,pending,approved,rejected'],
        ];
    }
}
