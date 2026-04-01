<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'service_type' => ['required', 'in:hotel,transport,airline'],
            'status' => ['nullable', 'in:active,inactive'],
            'contact_info' => ['required', 'array'],
            'contact_info.contact_name' => ['nullable', 'string', 'max:255'],
            'contact_info.email' => ['nullable', 'email', 'max:255'],
            'contact_info.phone' => ['nullable', 'string', 'max:50'],
            'contact_info.address' => ['nullable', 'string', 'max:500'],
            'contact_info.business_license' => ['nullable', 'string', 'max:500'],
            'business_license_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
            'contact_info.facility_images' => ['nullable', 'array'],
            'contact_info.facility_images.*' => ['string'],
            'facility_image_files' => ['nullable', 'array'],
            'facility_image_files.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
