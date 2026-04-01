<?php

namespace App\Services;

use Illuminate\Support\Str;

class PaymentService
{
    public function createReference(): string
    {
        return 'PAY-'.Str::upper(Str::random(12));
    }
}
