<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SignalementStatusHistory extends Model
{
    public $timestamps = false;

    protected $table = 'signalement_status_history';

    protected $fillable = [
        'signalement_id',
        'status',
        'changed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
        ];
    }

    public function signalement(): BelongsTo
    {
        return $this->belongsTo(Signalement::class);
    }
}
