<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class BoostPriceController extends Controller
{
    /**
     * Récupère le prix du boost par jour depuis les paramètres système
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBoostPrice()
    {
        // Récupérer le paramètre de prix du boost
        $user = auth()->user();
        $boostPercentage = $user->pack_de_publication->boost_percentage;
        $packPrice = $user->pack_de_publication->price;
        $price = $packPrice * $boostPercentage / 100;
        
        return response()->json([
            'success' => true,
            'price' => $price
        ]);
    }
}
