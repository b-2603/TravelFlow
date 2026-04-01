<?php

namespace App\Models;

class FavoriteTour extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'favorite_tours';

    protected $fillable = [
        'user_id',
        'tour_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }
}
