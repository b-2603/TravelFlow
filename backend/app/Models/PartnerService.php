<?php

namespace App\Models;

class PartnerService extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'partner_services';

    protected $fillable = [
        'partner_id',
        'name',
        'service_category',
        'price',
        'unit',
        'available_quantity',
        'pricing_note',
        'status',
        'cancellation_policy',
    ];

    protected $casts = [
        'price' => 'float',
        'available_quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }
}
