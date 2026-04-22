<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.name' => ['required', 'string', 'max:255'],
            'passengers.*.dob' => ['required', 'date'],
            'passengers.*.passport' => ['required', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

