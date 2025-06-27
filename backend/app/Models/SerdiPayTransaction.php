<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SerdiPayTransaction extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'wallet_id',
        'email',
        'phone_number',
        'telecom',
        'amount',
        'currency',
        'session_id',
        'transaction_id',
        'reference',
        'type',
        'direction',
        'status',
        'purpose',
        'request_data',
        'response_data',
        'callback_data',
        'callback_received_at',
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'request_data' => 'array',
        'response_data' => 'array',
        'callback_data' => 'array',
        'callback_received_at' => 'datetime',
    ];

    /**
     * Obtient l'utilisateur associé à cette transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtient le wallet associé à cette transaction.
     */
    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Vérifie si la transaction est réussie.
     *
     * @return bool
     */
    public function isSuccessful()
    {
        return $this->status === 'completed';
    }

    /**
     * Vérifie si la transaction est en attente.
     *
     * @return bool
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Vérifie si la transaction a échoué.
     *
     * @return bool
     */
    public function isFailed()
    {
        return $this->status === 'failed';
    }

    /**
     * Vérifie si la transaction a expiré.
     *
     * @return bool
     */
    public function isExpired()
    {
        return $this->status === 'expired';
    }

    /**
     * Vérifie si la transaction est un paiement.
     *
     * @return bool
     */
    public function isPayment()
    {
        return $this->type === 'payment';
    }

    /**
     * Vérifie si la transaction est un retrait.
     *
     * @return bool
     */
    public function isWithdrawal()
    {
        return $this->type === 'withdrawal';
    }

    /**
     * Scope pour filtrer les transactions par statut.
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope pour filtrer les transactions par type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope pour filtrer les transactions par direction.
     */
    public function scopeWithDirection($query, $direction)
    {
        return $query->where('direction', $direction);
    }
}
