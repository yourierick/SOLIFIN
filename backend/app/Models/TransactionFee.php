<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\ExchangeRates;
use Carbon\Carbon;

class TransactionFee extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array
     */
    protected $fillable = [
        'payment_method',
        'payment_type',
        'is_active',
    ];

    /**
     * Les attributs à caster.
     *
     * @var array
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Récupère les frais de transaction pour un moyen de paiement spécifique.
     *
     * @param string $paymentMethod
     * @param string|null $paymentType
     * @return TransactionFee|null
     */
    public static function getFeesForPaymentMethod(string $paymentMethod, string $paymentType = null)
    {
        $query = self::where('payment_method', $paymentMethod)
                    ->where('is_active', true);
        
        if ($paymentType) {
            $query->where('payment_type', $paymentType);
        }
        
        return $query->first();
    }
}
