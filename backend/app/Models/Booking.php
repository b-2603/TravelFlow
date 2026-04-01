<?php

namespace App\Models;

class Booking extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'bookings';

    protected $fillable = [
        'tour_id',
        'user_id',
        'assigned_agent_id',
        'departure_date',
        'num_pax',
        'total_price',
        'status',
        'passengers',
        'note',
        'internal_note',
        'special_requirements',
        'payment_status',
    ];

    protected $casts = [
        'departure_date' => 'datetime',
        'num_pax' => 'integer',
        'total_price' => 'float',
        'passengers' => 'array',
        'special_requirements' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'booking_id');
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function review()
    {
        return $this->hasOne(Review::class, 'booking_id');
    }

    public function refundRequests()
    {
        return $this->hasMany(RefundRequest::class, 'booking_id');
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class, 'booking_id');
    }
}
