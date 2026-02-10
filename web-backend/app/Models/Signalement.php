<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Signalement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'firebase_uid',
        'lat',
        'lng',
        'date_signalement',
        'surface',
        'niveau',
        'prix_par_m2',
        'entreprise_id',
        'status',
        'notes',
        'synced',
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
            'lat' => 'decimal:8',
            'lng' => 'decimal:8',
            'surface' => 'decimal:2',
            'niveau' => 'integer',
            'prix_par_m2' => 'decimal:2',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['budget'];

    /**
     * Get the computed budget: prix_par_m2 * niveau * surface.
     */
    public function getBudgetAttribute(): float
    {
        return round((float) $this->prix_par_m2 * (int) $this->niveau * (float) $this->surface, 2);
    }

    /**
     * Get the user that created the signalement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the entreprise that owns the signalement.
     */
    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }

    /**
     * Get the status history for this signalement.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(SignalementStatusHistory::class)->orderBy('changed_at', 'asc');
    }
}
