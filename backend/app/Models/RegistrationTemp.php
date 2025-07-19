<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationTemp extends Model
{
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'registration_temp';

    /**
     * Indique si les timestamps sont automatiquement gérés.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'temp_id',
        'registration_data',
        'calculated_data',
        'pack_id',
        'user_id',
        'email',
        'session_id',
        'transaction_id',
        'status',
        'error_message',
        'retry_token',
        'retry_count',
        'last_retry_at',
        'payment_confirmed',
        'payment_confirmed_at',
        'completed_at',
        'created_at',
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'registration_data' => 'array',
        'calculated_data' => 'array',
        'payment_confirmed' => 'boolean',
        'retry_count' => 'integer',
        'last_retry_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Obtenir le pack associé à cette inscription temporaire.
     *
     * @return BelongsTo
     */
    public function pack(): BelongsTo
    {
        return $this->belongsTo(Pack::class);
    }

    /**
     * Obtenir l'utilisateur associé à cette inscription temporaire (si créé).
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
