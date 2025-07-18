<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyController extends Controller
{
    /**
     * Convertir un montant d'une devise à une autre
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convert(Request $request)
    {
        // Log la requête entrante pour le débogage
        // Log::info('Requête de conversion reçue', [
        //     'request_data' => $request->all()
        // ]);

        // Valider les données d'entrée avec des règles plus souples
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'from' => 'required|string|max:3',
            'to' => 'required|string|max:3',
        ]);

        if ($validator->fails()) {
            Log::error('Validation échouée pour la conversion de devise', [
                'errors' => $validator->errors()->toArray()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Données invalides pour la conversion',
                'errors' => $validator->errors()
            ], 400);
        }

        $amount = $request->amount;
        $from = strtoupper($request->from);
        $to = strtoupper($request->to);

        // Si les devises sont identiques, pas besoin de conversion
        if ($from === $to) {
            return response()->json([
                'success' => true,
                'convertedAmount' => $amount,
                'from' => $from,
                'to' => $to,
                'rate' => 1
            ]);
        }

        try {
            // Récupérer les taux de conversion depuis l'API externe
            $conversionRates = $this->getConversionRates($from);
            
            if (!isset($conversionRates[$to])) {
                Log::error("Taux de conversion non disponible pour la paire {$from}/{$to}", [
                    'available_rates' => array_keys($conversionRates)
                ]);
                return response()->json([
                    'success' => false,
                    'message' => "Taux de conversion non disponible pour la devise {$to}"
                ], 400);
            }

            $rate = $conversionRates[$to];
            $convertedAmount = $amount * $rate;

            // Arrondir à 2 décimales
            $convertedAmount = round($convertedAmount, 2);

            // Log::info("Conversion réussie: {$amount} {$from} = {$convertedAmount} {$to} (taux: {$rate})");

            return response()->json([
                'success' => true,
                'convertedAmount' => $convertedAmount,
                'from' => $from,
                'to' => $to,
                'rate' => $rate
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur de conversion de devise: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la conversion de devise: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les taux de conversion pour une devise de base
     * en utilisant les données de la base de données
     *
     * @param string $baseCurrency
     * @return array
     */
    private function getConversionRates($baseCurrency)
    {
        try {
            // Récupérer les taux de change depuis la base de données
            $rates = \App\Models\ExchangeRates::where('currency', $baseCurrency)
                ->get(['target_currency', 'rate'])
                ->pluck('rate', 'target_currency')
                ->toArray();
            
            // Vérifier si des taux ont été trouvés
            if (!empty($rates)) {
                return $rates;
            }
            
            // Si aucun taux n'est trouvé, essayer de mettre à jour les taux depuis l'API
            Log::warning('Aucun taux de conversion trouvé en base de données pour ' . $baseCurrency . '. Tentative de mise à jour...');
            
            $success = \App\Models\ExchangeRates::updateRatesFromApi($baseCurrency);
            
            if ($success) {
                // Récupérer à nouveau les taux après la mise à jour
                $rates = \App\Models\ExchangeRates::where('currency', $baseCurrency)
                    ->get(['target_currency', 'rate'])
                    ->pluck('rate', 'target_currency')
                    ->toArray();
                
                if (!empty($rates)) {
                    return $rates;
                }
            }
            
            // En cas d'échec, on log l'erreur
            Log::error('Échec de récupération des taux de conversion depuis la base de données et l\'API');
            return 0;
        } catch (\Exception $e) {
            Log::error('Exception lors de la récupération des taux de conversion: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            // Fallback sur les taux fixes en cas d'exception
            return 0;
        }
    }
}
