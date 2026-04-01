<?php

namespace App\Models;

class TokenBlacklist extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'token_blacklist';

    public $timestamps = false;

    protected $fillable = [
        'token',
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
