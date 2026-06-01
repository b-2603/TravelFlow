<?php

namespace App\Models;

class NewsPromotion extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'news_promotions';

    public $timestamps = false;

    protected $fillable = [
        'type',
        'title',
        'summary',
        'content',
        'tag',
        'cover_image',
        'detail_sections',
        'key_highlights',
        'benefits',
        'conditions',
        'valid_from',
        'valid_until',
        'target_audience',
        'applicable_tours',
        'booking_channels',
        'faq',
        'contact_info',
        'related_links',
        'published_at',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'published_at' => 'date',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'detail_sections' => 'array',
        'key_highlights' => 'array',
        'benefits' => 'array',
        'conditions' => 'array',
        'target_audience' => 'array',
        'applicable_tours' => 'array',
        'booking_channels' => 'array',
        'faq' => 'array',
        'contact_info' => 'array',
        'related_links' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
