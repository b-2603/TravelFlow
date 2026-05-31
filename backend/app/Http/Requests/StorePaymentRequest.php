<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'string'],
            'method' => ['required', 'in:bank,vnpay'],
            'payment_scope' => ['nullable', 'in:deposit,full'],
            'amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
