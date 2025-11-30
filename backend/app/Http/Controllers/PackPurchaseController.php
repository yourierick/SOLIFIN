<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use App\Models\User;
use App\Models\UserPack;
use App\Services\CommissionService;
use App\Notifications\PackPurchased;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\WalletSystem;

class PackPurchaseController extends Controller
{
    protected $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    public function show($sponsor_code)
    {
        try {
            // $purchase = UserPack::with(['pack', 'user'])
            //     ->findOrFail($purchaseId);

            $user_pack = UserPack::with(['user', 'pack'])->where('referral_code', $sponsor_code)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'pack' => $user_pack->pack,
                    'sponsor' => $user_pack->user
                    //'purchase' => $purchase
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des détails de l\'achat',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function purchase(Request $request, Pack $pack)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'duration_months' => 'required|integer|min:1',
            ]);

            $total_paid = $pack->price * $validated['duration_months'];
            $walletsystem = WalletSystem::first();
            
            // Mettre à jour selon la devise du pack
            if ($pack->currency === 'CDF') {
                $walletsystem->balance_cdf += $total_paid;
                $walletsystem->total_in_cdf += $total_paid;
            } else {
                $walletsystem->balance_usd += $total_paid;
                $walletsystem->total_in_usd += $total_paid;
            }
            $walletsystem->update(); 

            $referralLetter = substr($pack->name, 0, 1);
            $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $referralCode = 'SPR' . $referralLetter . $referralNumber;

            // Vérifier que le code est unique
            while (UserPack::where('referral_code', $referralCode)->exists()) {
                $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                $referralCode = 'SPR' . $referralLetter . $referralNumber;
            }

            $userPack = $request->user()->packs()->create([
                'pack_id' => $pack->id,
                'status' => 'active',
                'purchase_date' => now(),
                'expiry_date' => now()->addMonths($validated['duration_months']),
                'is_admin_pack' => false,
                'payment_status' => 'completed',
                'referral_pack_name' => 'SPR',
                'referral_pack_name' => $pack->name,
                'referral_letter' => $referralLetter,
                'referral_number' => $referralNumber,
                'referral_code' => $referralCode
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pack acheté avec succès',
                'data' => $userPack
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans PackController@purchase: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'achat du pack'
            ], 500);
        }
    }
}
