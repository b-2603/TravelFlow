<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRefundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'string'],
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
            'amount_requested' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
