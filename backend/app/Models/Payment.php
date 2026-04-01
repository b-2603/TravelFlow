<?php

namespace App\Models;

class Payment extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'payments';

    protected $fillable = [
        'booking_id',
        'user_id',
        'amount',
        'method',
        'payment_scope',
        'status',
        'transaction_id',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
