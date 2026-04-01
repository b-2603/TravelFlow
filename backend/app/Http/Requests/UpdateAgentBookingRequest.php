<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'internal_note' => ['nullable', 'string', 'max:1000'],
            'special_requirements' => ['nullable', 'array'],
            'special_requirements.*' => ['string', 'max:255'],
            'departure_date' => ['nullable', 'date', 'after_or_equal:today'],
            'status' => ['nullable', 'in:pending,confirmed,cancelled,completed'],
        ];
    }
}
