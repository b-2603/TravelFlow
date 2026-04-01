<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

abstract class BaseModel extends Model
{
    protected $guarded = [];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
