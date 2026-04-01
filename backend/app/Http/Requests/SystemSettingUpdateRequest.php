<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SystemSettingUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'url', 'max:500'],
            'address' => ['nullable', 'string', 'max:500'],
            'hotline' => ['nullable', 'string', 'max:50'],
            'payment_methods' => ['nullable', 'array'],
            'payment_methods.*' => ['string', 'max:50'],
            'cancellation_policy' => ['nullable', 'array'],
            'email_templates' => ['nullable', 'array'],
            'featured_destinations' => ['nullable', 'array'],
            'featured_destinations.*' => ['string', 'max:120'],
            'banner_messages' => ['nullable', 'array'],
            'banner_messages.*' => ['string', 'max:200'],
        ];
    }
}
