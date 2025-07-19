<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseTemp extends Model
{
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'purchase_temp';

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'temp_id',
        'user_id',
        'pack_id',
        'purchase_data',
        'session_id',
        'transaction_id',
        'status',
        'error_message',
        'retry_token',
        'payment_confirmed',
        'completed_at',
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'purchase_data' => 'array',
        'payment_confirmed' => 'boolean',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Obtenir l'utilisateur associé à cet achat temporaire.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtenir le pack associé à cet achat temporaire.
     *
     * @return BelongsTo
     */
    public function pack(): BelongsTo
    {
        return $this->belongsTo(Pack::class);
    }
}
