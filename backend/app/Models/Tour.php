<?php

namespace App\Models;

class Tour extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'tours';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'destination',
        'category',
        'pinned',
        'duration_days',
        'max_pax',
        'price_per_person',
        'promotion_type',
        'promotion_value',
        'images',
        'highlights',
        'itinerary',
        'status',
        'reject_reason',
        'approved_at',
        'created_by',
        'assigned_guide_id',
        'guide_progress',
        'linked_partner_ids',
        'departures',
        'deleted_at',
        // Các trường mới cho custom tour
        'is_custom',
        'custom_for_customer',
        'custom_requests',
    ];

    protected $casts = [
        'pinned' => 'boolean',
        'duration_days' => 'integer',
        'max_pax' => 'integer',
        'price_per_person' => 'float',
        'promotion_value' => 'float',
        'images' => 'array',
        'highlights' => 'array',
        'itinerary' => 'array',
        'guide_progress' => 'array',
        'linked_partner_ids' => 'array',
        'departures' => 'array',
        'is_custom' => 'boolean',
        'custom_requests' => 'array',
        'approved_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'tour_id');
    }

    public function guide()
    {
        return $this->belongsTo(User::class, 'assigned_guide_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'tour_id');
    }

    public function favorites()
    {
        return $this->hasMany(FavoriteTour::class, 'tour_id');
    }
}
