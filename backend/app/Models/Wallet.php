<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance_usd',
        'balance_cdf',
        'total_earned_usd',
        'total_earned_cdf',
        'total_withdrawn_usd',
        'total_withdrawn_cdf',
    ];

    protected $casts = [
        'balance_usd' => 'decimal:2',
        'balance_cdf' => 'decimal:2',
        'total_earned_usd' => 'decimal:2',
        'total_earned_cdf' => 'decimal:2',
        'total_withdrawn_usd' => 'decimal:2',
        'total_withdrawn_cdf' => 'decimal:2',
    ];

    // Relation avec l'utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation avec les transactions
    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Ajoute des fonds au portefeuille
     * @param float $amount Montant à ajouter
     * @param string|null $description Description de la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletTransaction
     */
    public function addFunds(float $amount, string $currency, string $type, string $status, ?array $metadata = null): WalletTransaction
    {
        if ($currency === 'USD') {
            $this->balance_usd += $amount;
            $this->total_earned_usd += $amount;
        } else {
            $this->balance_cdf += $amount;
            $this->total_earned_cdf += $amount;
        }
        $this->save();

        return $this->transactions()->create([
            'amount' => $amount,
            'currency' => $currency,
            'mouvment' => 'in',
            'type' => $type,
            'status' => $status,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Retire des fonds du portefeuille
     * @param float $amount Montant à retirer
     * @param string|null $description Description de la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletTransaction|false
     */
    
     public function withdrawFunds(float $amount, string $currency, string $type, string $status, ?array $metadata = null): WalletTransaction|false
    {
        // Vérifier le solde selon la devise
        $hasEnoughBalance = ($currency === 'USD') ? ($this->balance_usd >= $amount) : ($this->balance_cdf >= $amount);
        
        if ($hasEnoughBalance) {
            if ($currency === 'USD') {
                $this->balance_usd -= $amount;
                $this->total_withdrawn_usd += $amount;
            } else {
                $this->balance_cdf -= $amount;
                $this->total_withdrawn_cdf += $amount;
            }
            $this->save();

            return $this->transactions()->create([
                'amount' => $amount,
                'currency' => $currency,
                'mouvment' => 'out',
                'type' => $type,
                'status' => $status,
                'metadata' => $metadata,
            ]);
        }

        return false;
    }

    /**
     * Obtient le total des commissions par type de pack
     * @return array
     */
    public function getCommissionsByPack(): array
    {
        return $this->transactions()
            ->where('type', 'commission')
            ->whereNotNull('metadata->pack_id')
            ->get()
            ->groupBy('metadata.pack_id')
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            })
            ->toArray();
    }

    /**
     * Obtient les statistiques des transactions du mois en cours
     * @return array
     */
    public function getCurrentMonthStats(): array
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        return [
            'earnings' => $this->transactions()
                ->where('mouvment', 'in')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
            'withdrawals' => $this->transactions()
                ->where('mouvment', 'out')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
        ];
    }
} 