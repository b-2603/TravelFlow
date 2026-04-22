<?php

namespace App\Models;

class SystemSetting extends BaseModel
{
    protected $connection = 'mongodb';

    protected $collection = 'system_settings';

    protected $fillable = [
        'company_name',
        'logo',
        'address',
        'hotline',
        'bank_name',
        'bank_code',
        'bank_account_number',
        'bank_account_name',
        'bank_branch',
        'payment_note_prefix',
        'payment_methods',
        'cancellation_policy',
        'email_templates',
        'featured_destinations',
        'banner_messages',
    ];

    protected $casts = [
        'payment_methods' => 'array',
        'cancellation_policy' => 'array',
        'email_templates' => 'array',
        'featured_destinations' => 'array',
        'banner_messages' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
