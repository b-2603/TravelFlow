<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GuideStatusUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:scheduled,boarding,in_progress,completed,issue'],
            'note' => ['nullable', 'string', 'max:1000'],
            'departure_date' => ['nullable', 'date'],
            'incident_type' => ['nullable', 'string', 'max:120'],
            'day_note' => ['nullable', 'string', 'max:1000'],
            'image_files' => ['nullable', 'array'],
            'image_files.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'attendance' => ['nullable', 'array'],
            'attendance.*.name' => ['required_with:attendance', 'string', 'max:120'],
            'attendance.*.present' => ['required_with:attendance', 'boolean'],
        ];
    }
}
