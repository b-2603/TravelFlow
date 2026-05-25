<?php

namespace App\Models;

class SupportTicket extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'support_tickets';

    protected $fillable = [
        'user_id',
        'booking_id',
        'subject',
        'message',
        'status',
        'priority',
        'messages',
        'reply',
        'handled_by',
        'handled_at',
        'assigned_agent_id',
    ];

    protected $casts = [
        'messages' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'handled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function handledBy()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
