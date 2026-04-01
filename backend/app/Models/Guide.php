<?php

namespace App\Models;

class Guide extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'guides';

    protected $fillable = [
        'user_id',
        'languages',
        'license_number',
        'specialties',
        'status',
    ];

    protected $casts = [
        'languages' => 'array',
        'specialties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
