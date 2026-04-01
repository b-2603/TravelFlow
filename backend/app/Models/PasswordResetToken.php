<?php

namespace App\Models;

class PasswordResetToken extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'password_resets';

    public $timestamps = false;

    protected $fillable = [
        'email',
        'token',
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
