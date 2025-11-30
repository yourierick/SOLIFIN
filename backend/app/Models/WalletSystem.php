<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WalletSystem extends Model
{
    protected $fillable = [
        'balance_usd',
        'balance_cdf',
        'total_in_usd',
        'total_in_cdf',
        'total_out_usd',
        'total_out_cdf',
    ];

    protected $casts = [
        'balance_usd' => 'decimal:2',
        'balance_cdf' => 'decimal:2',
        'total_in_usd' => 'decimal:2',
        'total_in_cdf' => 'decimal:2',
        'total_out_usd' => 'decimal:2',
        'total_out_cdf' => 'decimal:2',
    ];

    /**
     * Ajouter des fonds au wallet système
     */
    public function addFunds(float $amount, string $currency, string $type, string $status, array $metadata)
    {
        return DB::transaction(function () use ($amount, $currency, $type, $status, $metadata) {
            if ($currency === 'USD') {
                $this->balance_usd += $amount;
                $this->total_in_usd += $amount;
            } else {
                $this->balance_cdf += $amount;
                $this->total_in_cdf += $amount;
            }
            $this->save();

            return WalletSystemTransaction::create([
                'wallet_system_id' => $this->id,
                'amount' => $amount,
                'currency' => $currency,
                'mouvment' => 'in',
                'type' => $type,
                'status' => $status,
                'metadata' => $metadata
            ]);
        });
    }

    /**
     * Retire des fonds du wallet système
     */
    public function deductFunds(float $amount, string $currency, string $type, string $status, array $metadata)
    {
        return DB::transaction(function () use ($amount, $currency, $type, $status, $metadata) {
            if ($this->balance < $amount) {
                throw new \Exception('Fonds insuffisants dans le portefeuille système');
            }

            if ($currency === 'usd') {
                $this->balance_usd -= $amount;
                $this->total_out_usd -= $amount;
            } else {
                $this->balance_cdf -= $amount;
                $this->total_out_cdf -= $amount;
            }
            $this->save();

            return WalletSystemTransaction::create([
                'wallet_system_id' => $this->id,
                'amount' => $amount,
                'mouvment' => 'out',
                'type' => $type,
                'status' => $status,
                'metadata' => $metadata
            ]);
        });
    }

    /**
     * Relation avec les transactions
     */
    public function transactions()
    {
        return $this->hasMany(WalletSystemTransaction::class);
    }
}
