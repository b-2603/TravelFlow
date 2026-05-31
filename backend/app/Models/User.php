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
        // Loyalty fields
        'annual_spending',
        'annual_spending_year',
        'reward_points',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'annual_spending' => 'float',
        'annual_spending_year' => 'integer',
        'reward_points' => 'integer',
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

    /**
     * Return current year's annual spending (auto-reset if year changed).
     */
    public function getAnnualSpendingAttribute($value)
    {
        $year = (int) ($this->annual_spending_year ?? 0);
        if ($year !== (int) now()->format('Y')) {
            return 0.0;
        }

        return (float) ($value ?? 0.0);
    }

    public function addSpending(float $amount): void
    {
        $year = (int) now()->format('Y');
        $currentYear = (int) ($this->annual_spending_year ?? 0);
        if ($currentYear !== $year) {
            $this->annual_spending = 0.0;
            $this->annual_spending_year = $year;
        }

        $this->annual_spending = (float) ($this->annual_spending ?? 0) + $amount;
        $this->save();
    }

    public function addRewardPoints(int $points): void
    {
        $this->reward_points = (int) ($this->reward_points ?? 0) + $points;
        $this->save();
    }

    public function useRewardPoints(int $points): bool
    {
        $available = (int) ($this->reward_points ?? 0);
        if ($points <= 0 || $points > $available) {
            return false;
        }

        $this->reward_points = $available - $points;
        $this->save();

        return true;
    }
}
