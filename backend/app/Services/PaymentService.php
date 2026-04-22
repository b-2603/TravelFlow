<?php

namespace App\Services;

use Illuminate\Support\Str;

class PaymentService
{
    public function createReference(string $prefix = 'PAY'): string
    {
        $prefix = trim($prefix) !== '' ? trim($prefix) : 'PAY';

        return Str::upper($prefix).'-'.Str::upper(Str::random(12));
    }
}
