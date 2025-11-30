<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransactionFee;
use App\Models\Setting;
use Illuminate\Http\Request;
use App\Models\ExchangeRates;
use Illuminate\Support\Facades\Auth;

class TransactionFeeApiController extends Controller
{
    /**
     * Récupère les frais depuis les paramètres du système pour le transfert d'argent entre wallets
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFeesForSolifinMoneyTransfer()
    {
        $feePercentage = \App\Models\Setting::where('key', 'transfer_fee_percentage')->first();
        $feeCommission = \App\Models\Setting::where('key', 'transfer_commission')->first();
        $user = Auth::user();
        if (!$feePercentage) {
            // Valeur par défaut si le paramètre n'existe pas
            $feePercentage = 0;
        } else {
            $feePercentage = floatval($feePercentage->value);
        }

        if (!$feeCommission) {
            $feeCommission = 0;
        }else {
            if ($user->is_admin) {
                $feeCommission = floatval(0);
            }else {
                $feeCommission = floatval($feeCommission->value);
            }
        }
        
        return response()->json([
            'success' => true,
            'fee_percentage' => $feePercentage,
            'fee_commission' => $feeCommission
        ]);
    }
    
    /**
     * Calcule les frais d'achat pour un montant donné.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function calculatePurchaseFee(Request $request)
    {
        $amount = $request->input('amount', 0);
        
        // Récupérer le paramètre global purchase_fee_percentage depuis les paramètres du système
        $globalFeePercentage = (float) Setting::getValue('purchase_fee_percentage', 0);

        $fee = ((float)$amount) * ($globalFeePercentage / 100);
        $total = ((float)$amount) + $fee;

        return response()->json([
            'success' => true,
            'fee' => round($fee, 2),
            'percentage' => $globalFeePercentage,
            'total' => round($total, 2),
        ]);
    }
    
    /**
     * Calcule les frais de retrait pour un montant donné.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function calculateWithdrawalFee(Request $request)
    {
        $amount = $request->input('amount');
        
        // Récupérer le paramètre global withdrawal_fee_percentage depuis les paramètres du système
        $globalFeePercentage = 0; // Valeur par défaut si le paramètre n'est pas défini
        $setting = Setting::where('key', 'withdrawal_fee_percentage')->first();
        if ($setting) {
            $globalFeePercentage = (float) $setting->value;
        }
        
        // Calculer les frais en utilisant le pourcentage global mais en conservant les autres paramètres
        // (fee_fixed, fee_cap) spécifiques à la méthode de paiement
        $fee = $amount * ($globalFeePercentage / 100);
        
        // // Appliquer le montant minimum des frais
        // if ($fee < $transactionFee->fee_fixed) {
        //     $fee = $transactionFee->fee_fixed;
        // }
        
        // // Appliquer le montant maximum des frais si défini
        // if ($transactionFee->fee_cap && $fee > $transactionFee->fee_cap) {
        //     $fee = $transactionFee->fee_cap;
        // }
        
        $fee = round($fee, 2);
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'amount' => (float) $amount,
                'percentage' => $globalFeePercentage,
                'fee' => $fee,
            ]
        ]);
    }


    public function calculateApiFee($payment_method, $amount)
    {
        $model = TransactionFee::where('payment_method', $payment_method)->first();
        $fee = $model->transfer_fee_percentage * $amount / 100;
    
        return $fee;
    }
}
