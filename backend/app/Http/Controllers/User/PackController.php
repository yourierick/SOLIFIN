<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\Pack;
use App\Models\Commission;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\TransactionFee;
use App\Models\ExchangeRates;
use App\Services\CommissionService;
use App\Models\UserBonusPoint;
use App\Models\Setting;

class PackController extends Controller
{
    /**
     * Détermine le pas d'abonnement en mois selon le type d'abonnement
     *
     * @param string|null $subscriptionType Type d'abonnement (mensuel, trimestriel, etc.)
     * @return int Pas d'abonnement en mois
     */
    private function getSubscriptionStep($subscriptionType)
    {
        $type = strtolower($subscriptionType ?? '');
        
        switch ($type) {
            case 'monthly':
            case 'mensuel':
                return 1; // Pas de 1 mois pour abonnement mensuel
            case 'quarterly':
            case 'trimestriel':
                return 3; // Pas de 3 mois pour abonnement trimestriel
            case 'biannual':
            case 'semestriel':
                return 6; // Pas de 6 mois pour abonnement semestriel
            case 'annual':
            case 'yearly':
            case 'annuel':
                return 12; // Pas de 12 mois pour abonnement annuel
            case 'triennal':
                return 36;
            case 'quinquennal':
                return 60;
            default:
                return 1; // Par défaut, pas de 1 mois
        }
    }
    //pour la distribution des commissions
    private function processCommissions(UserPack $user_pack, $duration_months)
    {
        $commissionService = new CommissionService();
        $commissionService->distributeCommissions($user_pack, $duration_months);
    }

    //Récupérer tous les packs actifs que l'utilisateur peut acheter
    public function index()
    {
        try {
            $user_id = auth()->user()->id;
            $packs = Pack::where('status', true)
                ->get()
                ->map(function ($pack) use ($user_id) {
                    $pack->owner = UserPack::where('user_id', $user_id)
                        ->where('pack_id', $pack->id)
                        ->exists();
                    return $pack;
                });
            
            return response()->json([
                'success' => true,
                'data' => $packs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    //récupérer tous les packs achetés par l'utilisateur
    public function getUserPacks(Request $request)
    {
        try {
            $userPacks = UserPack::with(['pack', 'sponsor'])
                ->where('user_id', $request->user()->id)
                ->get()
                ->map(function ($userPack) {
                    $data = $userPack->toArray();
                    if ($userPack->sponsor) {
                        $data['sponsor_info'] = [
                            'name' => $userPack->sponsor->name,
                            'email' => $userPack->sponsor->email,
                            'phone' => $userPack->sponsor->phone,
                        ];
                    }
                    return $data;
                });

            return response()->json([
                'success' => true,
                'data' => $userPacks
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des packs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs'
            ], 500);
        }
    }

    //renouvellement d'un pack
    public function renewPack(Request $request, Pack $pack)
    {
        try {
            $validated = $request->validate([
                'payment_method' => 'required|string',
                'payment_details'=> ['requiredif:payment_method,credit-card|mobile-money', 'array'],
                'payment_type' => 'required|string',
                'duration_months' => 'required|integer|min:1',
                'amount' => 'required|numeric|min:0',
                'currency' => 'required|string',
                'fees' => 'required|numeric|min:0',
            ]);

            $paymentMethod = $validated['payment_method']; // Méthode spécifique (visa, m-pesa, etc.)
            $paymentType = $validated['payment_type']; // Type général (credit-card, mobile-money, etc.)
            $paymentAmount = $validated['amount']; // Montant sans les frais
            $paymentCurrency = $validated['currency'] ?? 'USD';
            $taux_de_change = 0;

            $transactionFeeModel = TransactionFee::where('payment_method', $paymentMethod)
                ->where('is_active', true);
            
            $transactionFee = $transactionFeeModel->first();

            // Calculer les frais de transaction globaux et spécifiques à la méthode de paiement
            $specificFees = 0;
            $globalFees = 0;
            if ($paymentMethod !== 'solifin-wallet') {
                // Recalculer les frais de transaction (pourcentage configuré dans le système)
                $globalFeePercentage = (float) Setting::getValue('purchase_fee_percentage', 0);
                
                // Calcul des frais globaux basé sur le montant du paiement
                $globalFees = ((float)$paymentAmount) * ($globalFeePercentage / 100);
                
                // Log des frais globaux calculés
                \Log::info('Frais globaux calculés pour renouvellement de pack', [
                    'montant' => $paymentAmount,
                    'pourcentage' => $globalFeePercentage,
                    'frais_globaux' => $globalFees
                ]);

                $specificFees = $transactionFee->calculateTransferFee((float) $paymentAmount, $paymentCurrency);
                
                // Log des frais spécifiques calculés
                \Log::info('Frais spécifiques calculés pour renouvellement de pack', [
                    'montant' => $paymentAmount,
                    'methode_paiement' => $paymentMethod,
                    'devise' => $paymentCurrency,
                    'frais_specifiques' => $specificFees
                ]);
            }
            
            // Montant total incluant les frais globaux (les frais spécifiques sont gérés par l'API de paiement)
            $totalAmount = $paymentAmount + $globalFees;
            
            // Log du montant total calculé
            \Log::info('Montant total calculé pour renouvellement de pack', [
                'montant_base' => $paymentAmount,
                'frais_globaux' => $globalFees,
                'montant_total' => $totalAmount
            ]);
            
            // Si la devise n'est pas en USD, convertir le montant en USD (devise de base)
            $amountInUSD = $totalAmount;
            $globalFeesInUSD = $globalFees;
            $specificFeesInUSD = $specificFees;
            
            if ($paymentCurrency !== 'USD') {
                try {
                    // Conversion du montant total en USD
                    $amountInUSD = $this->convertToUSD($totalAmount, $paymentCurrency);
                    $amountInUSD = round($amountInUSD, 2);
                    
                    // Conversion des frais globaux en USD
                    $globalFeesInUSD = $this->convertToUSD($globalFees, $paymentCurrency);
                    $globalFeesInUSD = round($globalFeesInUSD, 2);
                    
                    // Conversion des frais spécifiques en USD
                    $specificFeesInUSD = $this->convertToUSD($specificFees, $paymentCurrency);
                    $specificFeesInUSD = round($specificFeesInUSD, 2);

                    $taux_de_change = ExchangeRates::where('currency', $paymentCurrency)->where("target_currency", "USD")->first();
                    $taux_de_change = $taux_de_change->rate;
                    // Log des montants convertis
                    \Log::info('Montants convertis en USD pour renouvellement de pack', [
                        'montant_total_usd' => $amountInUSD,
                        'frais_globaux_usd' => $globalFeesInUSD,
                        'frais_specifiques_usd' => $specificFeesInUSD,
                        'devise_originale' => $paymentCurrency
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Erreur lors de la conversion de devise pour renouvellement de pack', [
                        'devise' => $paymentCurrency,
                        'erreur' => $e->getMessage()
                    ]);
                    
                    return response()->json([
                        "success" => false, 
                        "message" => "Impossible d'utiliser cette monnaie, veuillez payer en USD pour plus de simplicité"
                    ]);
                }
            }
            
            // Calcul des montants nets (sans les différents types de frais)
            $amountInUSDWithoutSpecificFees = round($amountInUSD - $specificFeesInUSD, 2); // Montant total sans frais spécifiques à l'api de paiement
            $amountWithoutGlobalFeesInUSD = round($amountInUSD - $globalFeesInUSD, 2); // Montant total sans frais globaux
            
            // Log des montants nets calculés
            \Log::info('Montants nets calculés pour renouvellement de pack', [
                'montant_total_usd' => $amountInUSD,
                'montant_sans_frais_specifiques' => $amountInUSDWithoutSpecificFees,
                'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD
            ]);
            
            // Vérifier que le montant net est suffisant pour couvrir le coût du pack
            // Récupérer le pas d'abonnement (fréquence)
            $step = $this->getSubscriptionStep($pack->abonnement);
            
            // Calculer le nombre de périodes d'abonnement
            $periods = ceil($validated['duration_months'] / $step);
            
            // Le coût total est le prix du pack multiplié par le nombre de périodes
            $packCost = $pack->price * $periods;
            
            \Log::info('Vérification du coût du pack pour renouvellement', [
                'prix_pack' => $pack->price,
                'duree_mois' => $validated['duration_months'],
                'pas_abonnement' => $step,
                'periodes' => $periods,
                'cout_total' => $packCost,
                'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD
            ]);
            
            if ($amountWithoutGlobalFeesInUSD < $packCost) {
                \Log::warning('Paiement insuffisant pour renouvellement de pack', [
                    'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD,
                    'cout_pack' => $packCost,
                    'difference' => $packCost - $amountWithoutGlobalFeesInUSD
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant payé est insuffisant pour couvrir le coût du pack'
                ], 400);
            }

            // Vérifier si l'utilisateur a déjà ce pack
            $userPack = UserPack::where('user_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->first();
                
            if (!$userPack) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pack non trouvé'
                ], 404);
            }
            
            $user = $userPack->user;
            DB::beginTransaction();

            if ($validated['payment_method'] === 'solifin-wallet') {
                $userWallet = $userPack->user->wallet;
                
                // Vérifier si le solde est suffisant
                if ($userWallet->balance < $amountInUSD) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Solde insuffisant dans votre wallet'
                    ], 400);
                }

                // Déduire les fonds du wallet
                $userWallet->withdrawFunds($amountInUSD, "purchase", "completed", [
                    "pack_id" => $pack->id, 
                    "pack_name" => $pack->name, 
                    "duration" => $validated['duration_months'] . " mois", 
                    "Méthode de paiement" => $validated['payment_method'],
                    "Détails de paiement" => $validated['payment_details'] ?? [],
                    "Dévise" => $validated['currency'],
                    "Montant original" => $validated['amount'] . $paymentCurrency,
                    "Type de paiement" => $validated['payment_type'],
                    "Frais globaux" => $globalFeesInUSD . "$",
                    "Frais spécifiques" => $specificFeesInUSD . "$",
                    "Montant sans frais globaux" => $amountWithoutGlobalFeesInUSD . "$",
                    "Taux du jour" => $taux_de_change . "%"
                ]);
            } else {
                //implémenter le paiement API

                $user->wallet->transactions()->create([
                    "wallet_id" => $user->wallet->id,
                    "type" => "purchase",
                    "amount" => $amountInUSD,
                    "status" => "completed",
                    "metadata" => [
                        "Opération" => "Renouvellement de pack",
                        "Nom du pack" => $pack->name,
                        "Durée de souscription" => $validated["duration_months"] . " mois",
                        "Méthode de paiement" => $validated['payment_method'],
                        "Détails de paiement" => $validated['payment_details'],
                        "Type de paiement" => $validated['payment_type'],
                        "Montant net payé" => $validated['amount'] . $paymentCurrency,
                        "Dévise" => $validated['currency'],
                        "Frais de transaction" => $validated['fees'] . $paymentCurrency
                    ]
                ]);
            }

            // Ajouter le montant au wallet system
            $walletsystem = WalletSystem::first();
            if (!$walletsystem) {
                $walletsystem = WalletSystem::create(['balance' => 0]);
            }
            
            if ($validated['payment_method'] === "solifin-wallet") {
                $walletsystem->transactions()->create([
                    'wallet_system_id' => $walletsystem->id,
                    'amount' => $amountInUSD,
                    'type' => 'sales',
                    'status' => 'completed',
                    'metadata' => [
                        "user" => $user->name, 
                        "pack_id" => $pack->id, 
                        "pack_name" => $pack->name, 
                        "Durée de souscription" => $validated['duration_months'] . " mois", 
                        "Méthode de paiement" => $validated['payment_method'], 
                        "Détails de paiement" => $validated['payment_details'] ?? [],
                        "Dévise" => $validated['currency'],
                        "Montant original" => $validated['amount'] . $paymentCurrency,
                        "Type de paiement" => $validated['payment_type'],
                        "Frais globaux" => $globalFeesInUSD . "$",
                        "Frais spécifiques" => $specificFeesInUSD . "$",
                        "Montant sans frais globaux" => $amountWithoutGlobalFeesInUSD . "$",
                        "Montant sans frais spécifiques" => $amountInUSDWithoutSpecificFees . "$",
                        "Taux du jour" => $taux_de_change . "%",
                        ]
                ]);
            }else {
                $walletsystem->addFunds($amountInUSDWithoutSpecificFees, "sales", "completed", [
                    "user" => $user->name, 
                    "pack_id" => $pack->id, 
                    "pack_name" => $pack->name, 
                    "Durée de souscription" => $validated['duration_months'] . "mois", 
                    "Méthode de paiement" => $validated['payment_method'], 
                    "Détails de paiement" => $validated['payment_details'] ?? [],
                    "Dévise" => $validated['currency'],
                    "Montant original" => $validated['amount'] . $paymentCurrency,
                    "Frais globaux" => $globalFeesInUSD . "$",
                    "Frais spécifiques" => $specificFeesInUSD . "$",
                    "Montant sans frais globaux" => $amountWithoutGlobalFeesInUSD . "$",
                    "Taux du jour" => $taux_de_change . "%"
                ]);
            }

            // on met à jour la date d'expiration
            $userPack->expiry_date = now()->addMonths($validated['duration_months']);
            $userPack->status = 'active';
            $userPack->save();

            // Distribuer les commissions
            $this->processCommissions($userPack, $validated['duration_months']);

            DB::commit();

            // Recharger le pack avec ses relations pour avoir les données complètes et à jour
            $updatedUserPack = UserPack::with(['pack', 'sponsor'])
                ->where('id', $userPack->id)
                ->first();
                
            // Ajouter les informations du sponsor si disponible
            $userPackData = $updatedUserPack->toArray();
            if ($updatedUserPack->sponsor) {
                $userPackData['sponsor_info'] = [
                    'name' => $updatedUserPack->sponsor->name,
                    'email' => $updatedUserPack->sponsor->email,
                    'phone' => $updatedUserPack->sponsor->phone,
                ];
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Pack renouvelé avec succès',
                'data' => [
                    'user_pack' => $userPackData
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Erreur lors du renouvellement du pack: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du renouvellement du pack: ' . $e->getMessage()
            ], 500);
        }
    }

    //Achat d'un nouveau pack
    public function purchase_a_new_pack(Request $request)
    {
        try {
            $validated = $request->validate([
                'packId' => 'required|exists:packs,id',
                'payment_method' => 'required|string',
                'payment_type' => 'required|string',
                'payment_details'=> ['requiredif:payment_type, credit-card|mobile-money', 'array'],
                'phoneNumber' => 'requiredif:payment_type, mobile-money|string',
                'referralCode' => 'nullable|exists:user_packs,referral_code', //code du sponsor
                'duration_months' => 'required|integer|min:1',
                'amount' => 'required|numeric|min:0',
                'fees' => 'required|numeric|min:0',
                'currency' => 'required|string',
            ]);


            // Vérifier que le code de parrainage est valide pour ce pack
            if ($validated['referralCode']) {
                $userPack = UserPack::where('pack_id', $validated['packId'])
                    ->where('referral_code', $validated['referralCode'])
                    ->first();

                if (!$userPack) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ce code de parrainage est invalide pour ce pack',
                    ]);
                }
            }


            $user = $request->user();
            $pack = Pack::findOrFail($validated['packId']);

            $paymentMethod = $validated['payment_method']; // Méthode spécifique (visa, m-pesa, etc.)
            $paymentType = $validated['payment_type']; // Type général (credit-card, mobile-money, etc.)
            $paymentAmount = $validated['amount']; // Montant sans les frais
            $paymentCurrency = $validated['currency'] ?? 'USD';
            $taux_de_change = 0;

            // Calculer les frais de transaction globaux et spécifiques à la méthode de paiement
            $specificFees = 0;
            $globalFees = 0;
            if ($paymentMethod !== 'solifin-wallet') {
                $transactionFeeModel = TransactionFee::where('payment_method', $paymentMethod)
                                                           ->where('is_active', true);
                $transactionFee = $transactionFeeModel->first();
                
                // Recalculer les frais de transaction (pourcentage configuré dans le système)
                $globalFeePercentage = (float) Setting::getValue('purchase_fee_percentage', 0);
                
                // Calcul des frais globaux basé sur le montant du paiement
                $globalFees = ((float)$paymentAmount) * ($globalFeePercentage / 100);
                
                // Log des frais globaux calculés
                \Log::info('Frais globaux calculés pour achat de pack', [
                    'montant' => $paymentAmount,
                    'pourcentage' => $globalFeePercentage,
                    'frais_globaux' => $globalFees
                ]);

                $specificFees = $transactionFee->calculateTransferFee((float) $paymentAmount, $paymentCurrency);
                    
                // Log des frais spécifiques calculés
                \Log::info('Frais spécifiques calculés pour achat de pack', [
                    'montant' => $paymentAmount,
                    'methode_paiement' => $paymentMethod,
                    'devise' => $paymentCurrency,
                    'frais_specifiques' => $specificFees
                ]);
            }
            
            // Montant total incluant les frais globaux (les frais spécifiques sont gérés par l'API de paiement)
            $totalAmount = $paymentAmount + $globalFees;
            
            // Log du montant total calculé
            \Log::info('Montant total calculé pour achat de pack', [
                'montant_base' => $paymentAmount,
                'frais_globaux' => $globalFees,
                'montant_total' => $totalAmount
            ]);
            
            // Si la devise n'est pas en USD, convertir le montant en USD (devise de base)
            $amountInUSD = $totalAmount;
            $globalFeesInUSD = $globalFees;
            $specificFeesInUSD = $specificFees;
            
            if ($paymentCurrency !== 'USD') {
                try {

                    $taux_de_change = ExchangeRates::where('currency', $paymentCurrency)->where("target_currency", "USD")->first();
                    $taux_de_change = $taux_de_change->rate;
                    // Conversion du montant total en USD
                    $amountInUSD = $this->convertToUSD($totalAmount, $paymentCurrency);
                    $amountInUSD = round($amountInUSD, 2);
                    
                    // Conversion des frais globaux en USD
                    $globalFeesInUSD = $this->convertToUSD($globalFees, $paymentCurrency);
                    $globalFeesInUSD = round($globalFeesInUSD, 2);
                    
                    // Conversion des frais spécifiques en USD
                    $specificFeesInUSD = $this->convertToUSD($specificFees, $paymentCurrency);
                    $specificFeesInUSD = round($specificFeesInUSD, 2);
                    
                    // Log des montants convertis
                    \Log::info('Montants convertis en USD pour achat de pack', [
                        'montant_total_usd' => $amountInUSD,
                        'frais_globaux_usd' => $globalFeesInUSD,
                        'frais_specifiques_usd' => $specificFeesInUSD,
                        'devise_originale' => $paymentCurrency
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Erreur lors de la conversion de devise pour achat de pack', [
                        'devise' => $paymentCurrency,
                        'erreur' => $e->getMessage()
                    ]);
                    
                    return response()->json([
                        "success" => false, 
                        "message" => "Impossible d'utiliser cette monnaie, veuillez payer en USD pour plus de simplicité"
                    ]);
                }
            }
            
            // Calcul des montants nets (sans les différents types de frais)
            $amountInUSDWithoutSpecificFees = round($amountInUSD - $specificFeesInUSD, 2); // Montant total sans frais spécifiques
            $amountWithoutGlobalFeesInUSD = round($amountInUSD - $globalFeesInUSD, 2); // Montant total sans frais globaux
            

            // Log des montants nets calculés
            \Log::info('Montants nets calculés pour achat de pack', [
                'montant_total_usd' => $amountInUSD,
                'montant_sans_frais_specifiques' => $amountInUSDWithoutSpecificFees,
                'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD
            ]);
            
            // Vérifier que le montant net est suffisant pour couvrir le coût du pack
            // Récupérer le pas d'abonnement (fréquence)
            $step = $this->getSubscriptionStep($pack->abonnement);
            
            // Calculer le nombre de périodes d'abonnement
            $periods = ceil($validated['duration_months'] / $step);
            
            // Le coût total est le prix du pack multiplié par le nombre de périodes
            $packCost = $pack->price * $periods;
            
            \Log::info('Vérification du coût du pack pour achat', [
                'prix_pack' => $pack->price,
                'duree_mois' => $validated['duration_months'],
                'pas_abonnement' => $step,
                'periodes' => $periods,
                'cout_total' => $packCost,
                'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD
            ]);
            
            if ($amountWithoutGlobalFeesInUSD < $packCost) {
                \Log::warning('Paiement insuffisant pour achat de pack', [
                    'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD,
                    'cout_pack' => $packCost,
                    'difference' => $packCost - $amountWithoutGlobalFeesInUSD
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant payé est insuffisant pour couvrir le coût du pack'
                ], 400);
            }

            DB::beginTransaction();
            
            try {
                if ($request->payment_method === 'solifin-wallet') {
                    // Vérifier le solde du wallet
                    $userWallet = Wallet::where('user_id', $user->id)->first();
                    
                    if (!$userWallet || $userWallet->balance < $amountInUSD) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant dans votre wallet'
                        ], 400);
                    }

                    // Vérifier si l'utilisateur a déjà ce pack
                    $existingUserPack = UserPack::where('user_id', $user->id)
                        ->where('pack_id', $pack->id)
                        ->first();

                    if ($existingUserPack) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Vous avez déjà ce pack, vous pouvez le renouveler une fois la durée de souscription écoulée'
                        ], 400);
                    } else {

                        //Si un code parrain est fourni, lier l'utilisateur au parrain
                        $sponsorPack = UserPack::where('referral_code', $request->referralCode)->first();

                        // Générer un code de parrainage unique
                        $referralLetter = substr($pack->name, 0, 1);
                        $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                        $referralCode = 'SPR' . $referralLetter . $referralNumber;

                        // Vérifier que le code est unique
                        while (UserPack::where('referral_code', $referralCode)->exists()) {
                            $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                            $referralCode = 'SPR' . $referralLetter . $referralNumber;
                        }

                        // Récupérer l'URL du frontend depuis le fichier .env
                        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

                        // Créer le lien de parrainage en utilisant l'URL du frontend
                        $referralLink = $frontendUrl . "/register?referral_code=" . $referralCode;

                        // Déduire le montant du wallet de l'utilisateur
                        $userWallet->withdrawFunds($amountInUSD, "purchase", "completed", [
                            "pack_id" => $pack->id, 
                            "pack_name" => $pack->name, 
                            "Durée de souscription" => $validated['duration_months'] . " mois", 
                            "Méthode de paiement" => $validated['payment_method'], 
                            "Type de paiement" => $validated['payment_type'], 
                            "Détails de paiement" => $validated['payment_details'] ?? [],
                            "Referral code" => $validated['referralCode'] ?? null,
                            "Dévise" => $validated['currency'],
                            "Montant original" => $validated['amount'] . $paymentCurrency,
                            "Frais" => $globalFeesInUSD . "$",
                            "Montant sans frais globaux" => $amountWithoutGlobalFeesInUSD ."$",
                            "Montant sans frais spécifiques" => $amountInUSDWithoutSpecificFees ."$",
                            "Taux du jour" => $taux_de_change . "%",
                        ]);

                        // Attacher le pack à l'utilisateur
                        $user->packs()->attach($pack->id, [
                            'status' => 'active',
                            'purchase_date' => now(),
                            'expiry_date' => now()->addMonths($validated['duration_months']),
                            'is_admin_pack' => false,
                            'payment_status' => 'completed',
                            'referral_prefix' => 'SPR',
                            'referral_pack_name' => $pack->name,
                            'referral_letter' => $referralLetter,
                            'referral_number' => $referralNumber,
                            'referral_code' => $referralCode,
                            'link_referral' => $referralLink,
                            'sponsor_id' => $sponsorPack->user_id ?? null,
                        ]);
                        
                        // Récupérer l'instance UserPack créée
                        $userpack = UserPack::where('user_id', $user->id)
                                          ->where('pack_id', $pack->id)
                                          ->where('referral_code', $referralCode)
                                          ->first();
                    }

                    // Ajouter le montant au wallet system
                    //vu que c'est le wallet qui paie, il n'y aura aucun ajout dans le wallet system.
                    $walletsystem = WalletSystem::first();
                    if (!$walletsystem) {
                        $walletsystem = WalletSystem::create(['balance' => 0]);
                    }

                    $walletsystem->transactions()->create([
                        'wallet_system_id' => $walletsystem->id,
                        'amount' => $amountInUSD,
                        'type' => 'sales',
                        'status' => 'completed',
                        'metadata' => [
                            "user" => $user->name, 
                            "pack_id" => $pack->id, 
                            "pack_name" => $pack->name, 
                            "Détails de paiement" => $validated['payment_details'] ?? [],
                            "Méthode de paiement" => $validated['payment_method'],
                            "Type de paiement" => $validated['payment_type'],
                            "Code parrain" => $validated['referralCode'] ?? null, 
                            "Durée de souscription" => $validated['duration_months'] . " mois",
                            "Montant original" => $validated['amount'] . $paymentCurrency,
                            "Dévise" => $validated['currency'],
                            "Frais globaux" => $globalFeesInUSD . "$",
                            "Frais spécifiques" => $specificFeesInUSD . "$",
                            "Montant sans frais globaux" => $amountWithoutGlobalFeesInUSD . "$",
                            "Montant sans frais spécifiques" => $amountInUSDWithoutSpecificFees . "$",
                            "Taux du jour" => $taux_de_change . "%",
                        ]
                    ]);

                } else {
                    // Vérifier si l'utilisateur a déjà ce pack
                    $existingUserPack = UserPack::where('user_id', $user->id)
                        ->where('pack_id', $pack->id)
                        ->first();

                    if ($existingUserPack) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Vous avez déjà ce pack, vous pouvez le renouveler une fois la durée de souscription écoulée'
                        ], 400);
                    } else {
                        //Implémenter le paiement API


                        //Si un code parrain est fourni, lier l'utilisateur au parrain
                        $sponsorPack = UserPack::where('referral_code', $request->referralCode)->first();

                        // Générer un code de parrainage unique
                        $referralLetter = substr($pack->name, 0, 1);
                        $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                        $referralCode = 'SPR' . $referralLetter . $referralNumber;

                        // Vérifier que le code est unique
                        while (UserPack::where('referral_code', $referralCode)->exists()) {
                            $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                            $referralCode = 'SPR' . $referralLetter . $referralNumber;
                        }

                        // Récupérer l'URL du frontend depuis le fichier .env
                        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

                        // Créer le lien de parrainage en utilisant l'URL du frontend
                        $referralLink = $frontendUrl . "/register?referral_code=" . $referralCode;

                        // Attacher le pack à l'utilisateur
                        $user->packs()->attach($pack->id, [
                            'status' => 'active',
                            'purchase_date' => now(),
                            'expiry_date' => now()->addMonths($validated['duration_months']),
                            'is_admin_pack' => false,
                            'payment_status' => 'completed',
                            'referral_prefix' => 'SPR',
                            'referral_pack_name' => $pack->name,
                            'referral_letter' => $referralLetter,
                            'referral_number' => $referralNumber,
                            'referral_code' => $referralCode,
                            'link_referral' => $referralLink,
                            'sponsor_id' => $sponsorPack->user_id ?? null,
                        ]);

                        $user->wallet->transactions()->create([
                            "wallet_id" => $user->wallet->id,
                            "type" => "purchase",
                            "amount" => $amountInUSD,
                            "status" => "completed",
                            "metadata" => [
                                "pack_id" => $pack->id, 
                                "pack_name" => $pack->name, 
                                "Durée de souscription" => $validated['duration_months'] . " mois", 
                                "Méthode de paiement" => $validated['payment_method'], 
                                "Type de paiement" => $validated['payment_type'], 
                                "Détails de paiement" => $validated['payment_details'] ?? [],
                                "Referral code" => $validated['referralCode'] ?? null,
                                "Dévise" => $validated['currency'],
                                "Montant original" => $validated['amount'] . $paymentCurrency,
                                "Frais" => $globalFeesInUSD . "$",
                                "Montant sans frais globaux" => $amountWithoutGlobalFeesInUSD ."$",
                                "Montant sans frais spécifiques" => $amountInUSDWithoutSpecificFees ."$",
                                "Taux du jour" => $taux_de_change . "%",
                            ]
                        ]);
                        
                        // Récupérer l'instance UserPack créée
                        $userpack = UserPack::where('user_id', $user->id)
                                          ->where('pack_id', $pack->id)
                                          ->where('referral_code', $referralCode)
                                          ->first();
                    }

                    // Ajouter le montant au wallet system
                    $walletsystem = WalletSystem::first();
                    if (!$walletsystem) {
                        $walletsystem = WalletSystem::create(['balance' => 0]);
                    }
                    $walletsystem->addFunds($amountInUSDWithoutSpecificFees, "sales", "completed", [
                        "user" => $user->name, 
                        "account_id" => $user->account_id,
                        "pack_id" => $pack->id, 
                        "Détails de paiement" => $validated['payment_details'],
                        "Méthode de paiement" => $paymentMethod,
                        "Type de paiement" => $paymentType,
                        "Nom du pack" => $pack->name, 
                        "Code sponsor" => $validated['referralCode'], 
                        "Durée de souscription" => $validated['duration_months'] . " mois",
                        "Montant total" => $paymentAmount . $paymentCurrency,
                        "Dévise originale" => $paymentCurrency,
                        "Frais globaux" => $globalFeesInUSD . "$",
                        "Montant net payé en USD" => $amountInUSD,
                        "Frais spécifique" => $specificFeesInUSD . "$",
                        "Taux du jour" => $taux_de_change . "%",
                    ]);
                }

                //Distribution des commissions
                $this->processCommissions($userpack, $validated['duration_months']);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Pack acheté avec succès',
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            \Log::info($e->getMessage());
            \Log::info($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'une erreur est survenue lors du traitement'
            ], 400);
        }
    }

    //récupérer les filleuls d'un pack
    public function getPackReferrals(Request $request, Pack $pack)
    {
        try {
            $userPack = UserPack::where('user_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->first();

            if (!$userPack) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pack non trouvé'
                ], 404);
            }

            $allGenerations = [];
            
            // Première génération (niveau 1)
            $level1Referrals = UserPack::with(['user', 'sponsor', 'pack'])
                ->where('sponsor_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->get()
                ->map(function ($referral) use ($request, $pack) {
                    $commissions = Commission::where('user_id', $request->user()->id)->where('source_user_id', $referral->user_id)->where('pack_id', $pack->id)->where('status', "completed")->sum('amount');
                    return [
                        'id' => $referral->user->id ?? null,
                        'name' => $referral->user->name ?? 'N/A',
                        'purchase_date' => optional($referral->purchase_date)->format('d/m/Y'),
                        'pack_status' => $referral->status ?? 'inactive',
                        'total_commission' => $commissions ?? 0,
                        'sponsor_id' => $referral->sponsor_id,
                        'referral_code' => $referral->referral_code ?? 'N/A',
                        'pack_name' => $referral->referral_pack_name ?? 'N/A',
                        'pack_price' => $referral->pack->price ?? 0,
                        'expiry_date' => optional($referral->expiry_date)->format('d/m/Y')
                    ];
                });
            $allGenerations[] = $level1Referrals;

            // Générations 2 à 4
            for ($level = 2; $level <= 4; $level++) {
                $currentGeneration = collect();
                $previousGeneration = $allGenerations[$level - 2];

                foreach ($previousGeneration as $parent) {
                    $children = UserPack::with(['user', 'sponsor', 'pack'])
                        ->where('sponsor_id', $parent['id'])
                        ->where('pack_id', $pack->id)
                        ->get()
                        ->map(function ($referral) use ($parent, $request, $pack) {
                            //calcul du total de commission générée par ce filleul pour cet utilisateur.
                            $commissions = Commission::where('user_id', $request->user()->id)->where('source_user_id', $referral->user_id)->where('pack_id', $pack->id)->where('status', "completed")->sum('amount');
                            return [
                                'id' => $referral->user->id ?? null,
                                'name' => $referral->user->name ?? 'N/A',
                                'purchase_date' => optional($referral->purchase_date)->format('d/m/Y'),
                                'pack_status' => $referral->status ?? 'inactive',
                                'total_commission' => $commissions ?? "0 $",
                                'sponsor_id' => $referral->sponsor_id,
                                'sponsor_name' => $parent['name'] ?? 'N/A',
                                'referral_code' => $referral->referral_code ?? 'N/A',
                                'pack_name' => $referral->pack->name ?? 'N/A',
                                'pack_price' => $referral->pack->price ?? 0,
                                'expiry_date' => optional($referral->expiry_date)->format('d/m/Y')
                            ];
                        });
                    $currentGeneration = $currentGeneration->concat($children);
                }
                $allGenerations[] = $currentGeneration;
            }

            return response()->json([
                'success' => true,
                'data' => $allGenerations
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des filleuls: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des filleuls'
            ], 500);
        }
    }

    /**
     * Récupère les statistiques détaillées d'un pack pour l'utilisateur connecté
     * 
     * @param Request $request
     * @param Pack $pack
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDetailedPackStats(Request $request, Pack $pack)
    {
        try {
            $userPack = UserPack::where('user_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->first();

            if (!$userPack) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pack non trouvé'
                ], 404);
            }

            // Récupérer tous les filleuls (toutes générations confondues)
            $allReferrals = [];
            $totalReferralsCount = 0;
            $referralsByGeneration = [0, 0, 0, 0]; // Compteur pour chaque génération
            $commissionsByGeneration = [0, 0, 0, 0]; // Commissions pour chaque génération
            $activeReferralsCount = 0;
            $inactiveReferralsCount = 0;
            $totalCommission = 0;
            $failedCommission = 0;

            // Récupérer les filleuls de première génération
            $firstGenReferrals = UserPack::with(['user', 'pack'])
                ->where('sponsor_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->get();

            $referralsByGeneration[0] = $firstGenReferrals->count();
            $totalReferralsCount += $referralsByGeneration[0];
            
            // Compter les actifs/inactifs de première génération
            foreach ($firstGenReferrals as $referral) {
                if ($referral->status === 'active') {
                    $activeReferralsCount++;
                } else {
                    $inactiveReferralsCount++;
                }
                
                // Ajouter à la liste complète des filleuls
                $allReferrals[] = [
                    'id' => $referral->user->id,
                    'name' => $referral->user->name,
                    'generation' => 1,
                    'purchase_date' => $referral->purchase_date,
                    'expiry_date' => $referral->expiry_date,
                    'status' => $referral->status,
                    'pack_name' => $referral->pack->name
                ];
            }

            // Récupérer les commissions de première génération
            $gen1Commissions = Commission::where('user_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->where('level', 1)
                ->get();
                
            $commissionsByGeneration[0] = $gen1Commissions->where('status', 'completed')->sum('amount');
            $totalCommission += $commissionsByGeneration[0];
            $failedCommission += $gen1Commissions->where('status', 'failed')->sum('amount');

            // Récupérer les filleuls et commissions des générations 2 à 4
            $currentGenReferrals = $firstGenReferrals->pluck('user_id')->toArray();
            
            for ($generation = 2; $generation <= 4; $generation++) {
                $nextGenReferrals = [];
                
                foreach ($currentGenReferrals as $sponsorId) {
                    $referrals = UserPack::with(['user', 'pack'])
                        ->where('sponsor_id', $sponsorId)
                        ->where('pack_id', $pack->id)
                        ->get();
                        
                    foreach ($referrals as $referral) {
                        $nextGenReferrals[] = $referral->user_id;
                        
                        // Compter par statut
                        if ($referral->status === 'active') {
                            $activeReferralsCount++;
                        } else {
                            $inactiveReferralsCount++;
                        }
                        
                        // Ajouter à la liste complète des filleuls
                        $allReferrals[] = [
                            'id' => $referral->user->id,
                            'name' => $referral->user->name,
                            'generation' => $generation,
                            'purchase_date' => $referral->purchase_date,
                            'expiry_date' => $referral->expiry_date,
                            'status' => $referral->status,
                            'pack_name' => $referral->pack->name
                        ];
                    }
                    
                    $referralsByGeneration[$generation-1] += $referrals->count();
                    $totalReferralsCount += $referrals->count();
                }
                
                // Récupérer les commissions pour cette génération
                $genCommissions = Commission::where('user_id', $request->user()->id)
                    ->where('pack_id', $pack->id)
                    ->where('level', $generation)
                    ->get();
                    
                $commissionsByGeneration[$generation-1] = $genCommissions->where('status', 'completed')->sum('amount');
                $totalCommission += $commissionsByGeneration[$generation-1];
                $failedCommission += $genCommissions->where('status', 'failed')->sum('amount');
                
                $currentGenReferrals = $nextGenReferrals;
            }

            // Déterminer la meilleure génération (celle qui a rapporté le plus)
            $bestGeneration = array_search(max($commissionsByGeneration), $commissionsByGeneration) + 1;

            // Récupérer les données pour les graphiques d'évolution
            $sixMonthsAgo = now()->subMonths(6);
            
            // Inscriptions mensuelles
            $monthlySignups = [];
            for ($i = 0; $i < 6; $i++) {
                $month = now()->subMonths($i);
                $count = collect($allReferrals)
                    ->filter(function ($referral) use ($month) {
                        return $referral['purchase_date'] && 
                               date('Y-m', strtotime($referral['purchase_date'])) === $month->format('Y-m');
                    })
                    ->count();
                    
                $monthlySignups[$month->format('Y-m')] = $count;
            }
            
            // Commissions mensuelles
            $monthlyCommissions = [];
            for ($i = 0; $i < 6; $i++) {
                $month = now()->subMonths($i);
                $startOfMonth = $month->copy()->startOfMonth();
                $endOfMonth = $month->copy()->endOfMonth();
                
                $amount = Commission::where('user_id', $request->user()->id)
                    ->where('pack_id', $pack->id)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('amount');
                    
                $monthlyCommissions[$month->format('Y-m')] = $amount;
            }
            
            // Trouver le top filleul (celui qui a recruté le plus de personnes)
            $topReferral = null;
            $maxRecruits = 0;
            
            foreach ($firstGenReferrals as $referral) {
                $recruitCount = UserPack::where('sponsor_id', $referral->user_id)
                    ->where('pack_id', $pack->id)
                    ->count();
                    
                if ($recruitCount > $maxRecruits) {
                    $maxRecruits = $recruitCount;
                    $topReferral = [
                        'id' => $referral->user->id,
                        'name' => $referral->user->name,
                        'recruit_count' => $recruitCount
                    ];
                }
            }

            // Récupérer les derniers paiements reçus
            $latestPayments = Commission::with('source_user')
                ->where('user_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($commission) {
                    return [
                        'id' => $commission->id,
                        'amount' => $commission->amount,
                        'date' => $commission->created_at->format('d/m/Y'),
                        'source' => $commission->source_user->name ?? 'Inconnu',
                        'level' => $commission->level
                    ];
                });

            // Modifier la structure des données pour les filleuls
            $latestReferrals = collect($allReferrals)
                ->sortByDesc('purchase_date')
                ->take(10)
                ->map(function ($referral) {
                    $validityMonths = $referral['purchase_date'] && $referral['expiry_date'] 
                        ? $referral['purchase_date']->diffInMonths($referral['expiry_date'])
                        : 0;
                    
                    return [
                        'id' => $referral['id'],
                        'name' => $referral['name'],
                        'pack_name' => $referral['pack_name'],
                        'purchase_date' => $referral['purchase_date'] ? $referral['purchase_date']->format('d/m/Y') : 'N/A',
                        'expiry_date' => $referral['expiry_date'] ? $referral['expiry_date']->format('d/m/Y') : 'N/A',
                        'validity_months' => $validityMonths,
                        'status' => $referral['status']
                    ];
                })
                ->values()
                ->toArray();

            // Modifier la structure pour tous les filleuls
            $allReferrals = collect($allReferrals)
                ->map(function ($referral) {
                    $validityMonths = $referral['purchase_date'] && $referral['expiry_date'] 
                        ? $referral['purchase_date']->diffInMonths($referral['expiry_date'])
                        : 0;
                    
                    return [
                        'id' => $referral['id'],
                        'name' => $referral['name'],
                        'generation' => $referral['generation'],
                        'pack_name' => $referral['pack_name'],
                        'purchase_date' => $referral['purchase_date'] ? $referral['purchase_date']->format('d/m/Y') : 'N/A',
                        'expiry_date' => $referral['expiry_date'] ? $referral['expiry_date']->format('d/m/Y') : 'N/A',
                        'validity_months' => $validityMonths,
                        'status' => $referral['status']
                    ];
                })
                ->values()
                ->toArray();

            $bonus = UserBonusPoint::where('user_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->first();

            $points_bonus = 0;
            if ($bonus) {
                $points_bonus = $bonus->points_disponibles + $bonus->points_utilises;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'general_stats' => [
                        'total_referrals' => $totalReferralsCount,
                        'referrals_by_generation' => $referralsByGeneration,
                        'active_referrals' => $activeReferralsCount,
                        'inactive_referrals' => $inactiveReferralsCount,
                        'total_commission' => $totalCommission,
                        'failed_commission' => $failedCommission,
                        'best_generation' => $bestGeneration
                    ],
                    'progression' => [
                        'monthly_signups' => $monthlySignups,
                        'monthly_commissions' => $monthlyCommissions,
                        'top_referral' => $topReferral
                    ],
                    'latest_referrals' => $latestReferrals,
                    'financial_info' => [
                        'total_commission' => $totalCommission,
                        'latest_payments' => $latestPayments
                    ],
                    'all_referrals' => $allReferrals,
                    'points_bonus' => $points_bonus,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des statistiques détaillées: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques détaillées'
            ], 500);
        }
    }

    /**
     * Convertit un montant d'une devise en USD
     * 
     * @param float $amount Montant à convertir
     * @param string $currency Devise d'origine
     * @return float Montant en USD
     * @throws \Exception Si le taux de conversion n'est pas disponible
     */
    private function convertToUSD($amount, $currency)
    {
        if ($currency === 'USD') {
            return $amount;
        }else {
            $amount = round($amount, 2);
        }
        
        try {
            // Récupérer le taux de conversion depuis la BD
            $exchangeRate = ExchangeRates::where('currency', $currency)->where("target_currency", "USD")->first();
            if ($exchangeRate) {
                $amount = $amount * $exchangeRate->rate;
                return round($amount, 2);
            } else {
                // Si le taux n'est pas trouvé, lever une exception
                throw new \Exception("Taux de conversion non disponible pour la devise $currency");
            }
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la conversion de devise: ' . $e->getMessage());
            throw new \Exception("Impossible d'utiliser cette monnaie, veuillez payer en USD pour plus de simplicité");
        }
    }
} 