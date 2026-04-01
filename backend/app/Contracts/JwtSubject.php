<?php

namespace App\Contracts;

interface JwtSubject
{
    public function getJwtIdentifier(): string;

    public function getJwtCustomClaims(): array;
}
