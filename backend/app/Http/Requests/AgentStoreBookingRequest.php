<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AgentStoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'string'],
            'tour_id' => ['required', 'string'],
            'departure_date' => ['required', 'date', 'after_or_equal:today'],
            'num_pax' => ['required', 'integer', 'min:1'],
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.name' => ['required', 'string', 'max:255'],
            'passengers.*.dob' => ['required', 'date'],
            'passengers.*.passport' => ['required', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:1000'],
            'internal_note' => ['nullable', 'string', 'max:1000'],
            'special_requirements' => ['nullable', 'array'],
            'special_requirements.*' => ['string', 'max:255'],
        ];
    }
}
