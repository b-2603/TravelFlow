<?php

namespace App\Models;

use App\Contracts\JwtSubject;
use Illuminate\Auth\Authenticatable as AuthenticatableTrait;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Hash;
use MongoDB\Laravel\Auth\User as MongoAuthenticatable;

class User extends MongoAuthenticatable implements Authenticatable, JwtSubject
{
    use AuthenticatableTrait;

    protected $connection = 'mongodb';

    protected $collection = 'users';

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'phone',
        'avatar',
        'role',
        'role_name_vi',
        'status',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function roleNameMap(): array
    {
        return [
            'admin' => 'Quản trị viên',
            'tour_manager' => 'Quản lý tour',
            'agent' => 'Nhân viên tư vấn',
            'accountant' => 'Kế toán / Tài chính',
            'guide' => 'Hướng dẫn viên',
            'partner' => 'Đối tác dịch vụ',
            'customer' => 'Khách hàng',
        ];
    }

    public function tours()
    {
        return $this->hasMany(Tour::class, 'created_by');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'user_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'user_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'user_id');
    }

    public function partnerProfile()
    {
        return $this->hasOne(Partner::class, 'user_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    public function guideProfile()
    {
        return $this->hasOne(Guide::class, 'user_id');
    }

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

    public function getFullNameAttribute(): string
    {
        return trim((string) $this->name);
    }

    public function getRoleNameViAttribute($value): string
    {
        if (filled($value)) {
            return $value;
        }

        return self::roleNameMap()[$this->role] ?? $this->role;
    }

    public function setPasswordAttribute($value): void
    {
        if (empty($value)) {
            return;
        }

        $this->attributes['password'] = Hash::needsRehash($value) ? Hash::make($value) : $value;
    }

    public function getJwtIdentifier(): string
    {
        return (string) $this->getKey();
    }

    public function getJwtCustomClaims(): array
    {
        return [
            'email' => $this->email,
            'username' => $this->username,
            'role' => $this->role,
            'role_name_vi' => $this->role_name_vi,
            'name' => $this->name,
        ];
    }
}
