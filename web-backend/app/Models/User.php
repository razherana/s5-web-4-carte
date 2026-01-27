<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'firebase_uid',
        'email',
        'password',
        'role',
        'login_attempts',
        'locked_until',
        'synced',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'locked_until' => 'datetime',
        ];
    }

    /**
     * Check if the account is locked.
     */
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Increment login attempts and lock account if needed.
     */
    public function incrementLoginAttempts(): void
    {
        $this->login_attempts++;

        $maxAttempts = config('auth.max_login_attempts', 3);

        if ($this->login_attempts >= $maxAttempts) {
            $lockoutDuration = config('auth.lockout_duration', 900);
            $this->locked_until = now()->addSeconds($lockoutDuration);
        }

        $this->save();
    }

    /**
     * Reset login attempts.
     */
    public function resetLoginAttempts(): void
    {
        $this->login_attempts = 0;
        $this->locked_until = null;
        $this->save();
    }

    /**
     * Get the signalements created by the user.
     */
    public function signalements(): HasMany
    {
        return $this->hasMany(Signalement::class);
    }
}
