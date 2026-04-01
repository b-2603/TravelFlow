<?php

namespace App\Models;

class ActivityLog extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'activity_logs';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'detail',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'detail' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
