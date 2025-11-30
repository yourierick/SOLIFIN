<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_id',
        'amount',
        'currency',
        'mouvment',
        'type',
        'status',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    // Relation avec le wallet
    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    // Scope pour les crédits
    public function scopeCreditsUSD($query)
    {
        return $query->where('mouvment', 'in');
    }

    // Scope pour les débits
    public function scopeDebitsUSD($query)
    {
        return $query->where('mouvment', 'out');
    }

    // Scope pour les crédits
    public function scopeCreditsCDF($query)
    {
        return $query->where('mouvment', 'in');
    }

    // Scope pour les débits
    public function scopeDebitsCDF($query)
    {
        return $query->where('mouvment', 'out');
    }
} 