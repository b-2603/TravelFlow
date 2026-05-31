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
        'original_total_price',
        'points_used',
        'points_earned',
        'rewarded_at',
        'status',
        'passengers',
        'note',
        'internal_note',
        'special_requirements',
        'payment_status',
        // Các trường mới cho agent
        'passenger_confirmed',
        'passenger_confirmation_note',
        'passenger_confirmed_at',
        'cancellation_requested',
        'cancellation_requested_at',
        'cancellation_reason',
        'cancellation_note',
        'requested_refund_amount',
        'reminders',
    ];

    protected $casts = [
        'departure_date' => 'datetime',
        'num_pax' => 'integer',
        'total_price' => 'float',
        'original_total_price' => 'float',
        'points_used' => 'integer',
        'points_earned' => 'integer',
        'rewarded_at' => 'datetime',
        'passengers' => 'array',
        'special_requirements' => 'array',
        'reminders' => 'array',
        'passenger_confirmed' => 'boolean',
        'passenger_confirmed_at' => 'datetime',
        'cancellation_requested' => 'boolean',
        'cancellation_requested_at' => 'datetime',
        'requested_refund_amount' => 'float',
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
