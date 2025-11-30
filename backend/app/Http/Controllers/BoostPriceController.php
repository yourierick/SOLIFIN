<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class BoostPriceController extends Controller
{
    /**
     * Récupère le prix du boost par jour selon la devise sélectionnée
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBoostPrice(Request $request)
    {
        // Récupérer la devise depuis la requête (USD par défaut)
        $currency = $request->query('currency', 'USD');
        
        // Valider que la devise est supportée
        if (!in_array(strtoupper($currency), ['USD', 'CDF'])) {
            return response()->json([
                'success' => false,
                'message' => 'Devise non supportée. Utilisez USD ou CDF.'
            ], 400);
        }
        
        $user = auth()->user();
        $boostPercentage = $user->pack_de_publication->boost_percentage;
        
        // Utiliser le prix selon la devise sélectionnée
        if (strtoupper($currency) === 'CDF') {
            $packPrice = $user->pack_de_publication->cdf_price ?? 0;
        } else {
            $packPrice = $user->pack_de_publication->price ?? 0;
        }
        
        $price = $packPrice * $boostPercentage / 100;
        
        return response()->json([
            'success' => true,
            'price' => $price,
            'currency' => strtoupper($currency),
            'pack_price_used' => $packPrice,
            'boost_percentage' => $boostPercentage
        ]);
    }
}
