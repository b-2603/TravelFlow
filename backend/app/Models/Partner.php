<?php

namespace App\Models;

class Partner extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'partners';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'company_name',
        'service_type',
        'contact_info',
        'status',
        'created_at',
    ];

    protected $casts = [
        'contact_info' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function services()
    {
        return $this->hasMany(PartnerService::class, 'partner_id');
    }
}
