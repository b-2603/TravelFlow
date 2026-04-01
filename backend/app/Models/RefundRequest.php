<?php

namespace App\Models;

class RefundRequest extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'refund_requests';

    protected $fillable = [
        'user_id',
        'booking_id',
        'reason',
        'amount_requested',
        'preferred_resolution',
        'resolution_note',
        'refund_rate',
        'fee_amount',
        'days_before_departure',
        'processing_days',
        'policy_snapshot',
        'status',
        'admin_note',
    ];

    protected $casts = [
        'amount_requested' => 'float',
        'refund_rate' => 'float',
        'fee_amount' => 'float',
        'days_before_departure' => 'integer',
        'processing_days' => 'array',
        'policy_snapshot' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
