<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupportReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reply' => ['required', 'string', 'max:2000'],
            'status' => ['nullable', 'in:open,answered,closed'],
        ];
    }
}
