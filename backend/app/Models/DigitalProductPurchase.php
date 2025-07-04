<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DigitalProductPurchase extends Model
{
    use HasFactory;

    protected $table = 'digital_product_purchases';

    protected $fillable = [
        'digital_product_id',
        'user_id',
        'prix',
        'frais',
        'montant_total',
        'devise',
        'transaction_id',
        'statut', // 'en_cours', 'complete', 'annule'
    ];

    protected $casts = [
        'prix' => 'float',
        'frais' => 'float',
        'montant_total' => 'float',
    ];

    /**
     * Récupérer le produit digital associé à cet achat
     */
    public function digitalProduct(): BelongsTo
    {
        return $this->belongsTo(DigitalProduct::class);
    }

    /**
     * Récupérer l'utilisateur qui a effectué l'achat
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Récupérer la transaction associée à cet achat
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(SerdiPayTransaction::class, 'transaction_id');
    }
}
