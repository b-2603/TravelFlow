<?php

namespace App\Models;

class Review extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'reviews';

    public $timestamps = false;

    protected $fillable = [
        'tour_id',
        'user_id',
        'booking_id',
        'title',
        'rating',
        'comment',
        'images',
        'status',
        'created_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'images' => 'array',
        'created_at' => 'datetime',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
