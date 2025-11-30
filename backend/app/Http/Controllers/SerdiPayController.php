<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SerdiPayService;
use Illuminate\Support\Facades\Auth;
use App\Models\Wallet;
use App\Models\User;
use App\Models\Pack;
use App\Models\TransactionFee;
use App\Models\ExchangeRates;
use App\Models\Setting;
use App\Models\WalletTransaction;
use App\Models\WalletSystemTransaction;
use App\Models\SerdiPayTransaction;
use App\Models\UserPack;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Notifications\PaymentStatusNotification;
use App\Notifications\TransactionNotification;
use App\Notifications\WithdrawalRequestPaid;
use App\Services\WithdrawalService;

class SerdiPayController extends Controller
{
    protected $serdiPayService;
    const STATUS_PENDING = 'pending';
    const STATUS_FAILED = 'failed';
    const STATUS_COMPLETED = 'completed';
    const STATUS_INITIATED = 'initiated';

    public function __construct(SerdiPayService $serdiPayService)
    {
        $this->serdiPayService = $serdiPayService;
    }
    
    /**
     * Initialise un retrait via SerdiPay après approbation d'une demande de retrait
     *
     * @param \App\Models\WithdrawalRequest $withdrawal La demande de retrait approuvée
     * @return array Résultat de l'initialisation avec statut et message
     */
    public function initialWithdrawal($withdrawal)
    {
        $walletTransaction = $withdrawal->user->wallet->transactions()->where('type', 'withdrawal')->where('withdrawal_request_id', $withdrawal->id)->first();
        try {
            // Vérifier que la demande est bien approuvée
            if ($withdrawal->status !== self::STATUS_APPROVED) {
                return [
                    'success' => false,
                    'message' => 'La demande de retrait doit être approuvée avant de pouvoir initialiser le paiement',
                    'status_code' => 400
                ];
            }
            
            // Récupérer les informations nécessaires depuis la demande de retrait
            $phoneNumber = $withdrawal->payment_details['phoneNumber'] ?? null;
            $amount = $withdrawal->payment_details['montant_a_retirer'];
            $currency = $withdrawal->payment_details['devise'] ?? 'USD';
            $paymentMethod = $withdrawal->payment_method;
            $payment_type = $withdrawal->payment_details['payment_type'];
            
            $methode_paiement = $this->mapPaymentMethodToSerdiPay($paymentMethod);
            if (!$methode_paiement) {
                return [
                    'success' => false,
                    'message' => 'Méthode de paiement non supportée'
                ];
            }

            // Préparer les détails de paiement en fonction du type
            $paymentDetails = [];
            if ($paymentMethod === 'mobile-money') {
                // Pour mobile money, extraire le numéro de téléphone
                if (empty($phoneNumber)) {
                    return [
                        'success' => false,
                        'message' => 'Numéro de téléphone requis pour le paiement mobile'
                    ];
                }
                    
                // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
                $phoneNumber = preg_replace('/\D/', '', $phoneNumber);
                
                // Vérifier le format du numéro (243 suivi de 9 chiffres)
                if (!preg_match('/^243\d{9}$/', $phoneNumber)) {
                    return [
                        'success' => false,
                        'message' => 'Format de numéro de téléphone invalide. Format attendu: 243XXXXXXXXX'
                    ];
                }
                    
                $phoneNumber = $phoneNumber;
            } else {
                // Pour carte de crédit, vérifier les détails de la carte
                $requiredFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'];
                foreach ($requiredFields as $field) {
                    if (empty($withdrawal->payment_details['payment_details'][$field])) {
                        return [
                            'success' => false,
                            'message' => 'Champ requis manquant: ' . $field
                        ];
                    }
                }
            }

            $description = 'Retrait de ' . $withdrawal->payment_details['montant_a_retirer'] . ' ' . $withdrawal->currency;

            $paymentDetails['phoneNumber'] = $withdrawal->payment_details['phoneNumber'] ?? null;
            $paymentDetails['amount'] = $withdrawal->payment_details['montant_a_retirer'] ?? null;
            $paymentDetails['currency'] = $withdrawal->currency;
            $paymentDetails['paymentMethod'] = $this->mapPaymentMethodToSerdiPay($withdrawal->payment_method);
            $paymentDetails['userId'] = $withdrawal->user_id ?? null;
            $paymentDetails['walletId'] = $withdrawal->user->wallet->id ?? null;
            $paymentDetails['email'] = $withdrawal->user->email ?? null;
            $paymentDetails['cardDetails'] = $withdrawal->payment_details['payment_type'] === 'credit-card' ? $withdrawal->payment_details['payment_details'] : null;

            
            // Préparer les paramètres pour l'API SerdiPay
            $serdiPayParams = $this->prepareSerdiPayParams($paymentDetails, $withdrawal->id, $description);
            
            // Initier le paiement via SerdiPay
            $result = $this->serdiPayService->initiateWithdrawal(
                $serdiPayParams['phoneNumber'],
                $serdiPayParams['amount'],
                $serdiPayParams['currency'],
                $serdiPayParams['paymentMethod'],
                $serdiPayParams['userId'],
                $serdiPayParams['walletId'],
                $serdiPayParams['email'],
                $serdiPayParams['description'],
                $serdiPayParams['tempId'],
                $serdiPayParams['cardDetails']
            );
            
            // Vérifier le résultat de l'initialisation du paiement
            if (!$result['success']) {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Erreur lors de l\'initialisation du paiement'
                ];
            }

            $withdrawal->session_id = $result['session_id'];
            $withdrawal->transaction_id = $result['transaction_id'];
            $withdrawal->payment_status = self::STATUS_INITIATED;
            $withdrawal->save();
                
            // Enregistrer la transaction dans le wallet system
            $walletService = app(\App\Services\WalletService::class);
            
            $walletService->recordSystemTransaction([
                'amount' => $withdrawal->payment_details['montant_a_retirer'],
                'type' => 'withdrawal',
                'status' => self::STATUS_PENDING,
                'metadata' => [
                    'user' => $withdrawal->user->name,
                    'withdrawal_id' => $withdrawal->id,
                    'phone_number' => $phoneNumber,
                    'Méthode de paiement' => $paymentMethod,
                    'Montant à retirer' => $withdrawal->payment_details['montant_a_retirer'],
                    'Devise' => $withdrawal->payment_details['devise'],
                    'Frais de transaction' => $withdrawal->payment_details['frais_de_retrait'] . $withdrawal->payment_details['devise'],
                    'Frais de commission' => $withdrawal->payment_details['frais_de_commission'] . $withdrawal->payment_details['devise'],
                    'description' => "Retrait ID: {$withdrawal->id} via {$paymentMethod} au numéro {$phoneNumber}"
                ]
            ]);
                
            return [
                'success' => true,
                'message' => 'Retrait initialisé avec succès',
            ];
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'initialisation du retrait', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'withdrawal_id' => $withdrawal->id ?? null
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation du retrait: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

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
    
    /**
     * Convertit une méthode de paiement du format frontend au format SerdiPay
     *
     * @param string $method Méthode de paiement du frontend
     * @return string|null Code SerdiPay correspondant ou null si non supporté
     */
    private function mapPaymentMethodToSerdiPay($method)
    {
        $mapping = [
            'orange-money' => 'OM',
            'airtel-money' => 'AM',
            'm-pesa' => 'MP',
            'afrimoney' => 'AF',
            'visa' => 'VISA',
            'mastercard' => 'MC',
            'american-express' => 'AE'
        ];
        
        return $mapping[$method] ?? null;
    }
    
    /**
     * Calcule les frais de transaction (globaux et spécifiques à l'API)
     *
     * @param string $paymentMethod Méthode de paiement
     * @param float $paymentAmount Montant du paiement
     * @param string $paymentCurrency Devise du paiement
     * @return array Tableau contenant les frais calculés
     */
    private function calculateFees($paymentMethod, $paymentAmount, $paymentCurrency)
    {
        $result = [
            'globalFees' => 0,
            'transactionFeeModel' => null
        ];
        
        // Récupérer le modèle de frais de transaction pour cette méthode de paiement
        $transactionFeeModel = TransactionFee::where('payment_method', $paymentMethod)
            ->where('is_active', true)->first();
            
        if (!$transactionFeeModel) {
            return $result;
        }
        
        $result['transactionFeeModel'] = $transactionFeeModel;
        
        if ($paymentMethod !== 'solifin-wallet') {
            // Recalculer les frais de transaction (pourcentage configuré dans le système)
            $purchase_fee_percentage = (float) Setting::getValue('purchase_fee_percentage', 0);
            
            // Calcul des frais globaux basé sur le montant du paiement
            $result['globalFees'] = round(((float)$paymentAmount) * ($purchase_fee_percentage / 100), 2);
        }
        
        return $result;
    }
    
    /**
     * Vérifie si le montant payé est suffisant pour le pack
     *
     * @param float $netAmount Montant net (sans frais globaux)
     * @param object $pack Pack à acheter
     * @param int $durationMonths Durée en mois
     * @return array Résultat de la vérification
     */
    private function verifyPackPayment($netAmount, $pack, $durationMonths, $currency)
    {
        $result = [
            'success' => true,
            'message' => '',
            'packCost' => 0,
            'step' => 0,
            'periods' => 0
        ];
        
        // Récupérer le pas d'abonnement (fréquence)
        $step = $this->getSubscriptionStep($pack->abonnement);
        $result['step'] = $step;

        $baseAmount = 0;
        
        if ($currency === "USD") {
            // Calculer le montant de base : prix du pack * pas d'abonnement
            $baseAmount = $pack->price * $step;
        }else {
            // Calculer le montant de base : prix du pack * pas d'abonnement
            $baseAmount = $pack->cdf_price * $step;
        }

        
        // Calculer le nombre de périodes d'abonnement
        $periods = ceil($durationMonths / $step);
        $result['periods'] = $periods;
        
        // Le coût total est le montant de base multiplié par le nombre de périodes
        $packCost = $baseAmount * $periods;
        $result['packCost'] = $packCost;
        
        // Vérifier que le montant net est suffisant
        if ($netAmount < $packCost) {
            $result['success'] = false;
            $result['message'] = 'Le montant payé est insuffisant pour couvrir le coût du pack';
        }
        
        return $result;
    }
    
    /**
     * Prépare les paramètres pour l'appel à l'API SerdiPay
     *
     * @param array $data Données de paiement
     * @param string $tempId ID temporaire pour la référence
     * @param string $description Description de la transaction
     * @return array Paramètres pour l'API SerdiPay
     */
    private function prepareSerdiPayParams($data, $tempId, $description = 'Achat de pack')
    {
        return [
            'phoneNumber' => $data['phoneNumber'] ?? null,
            'amount' => round(round($data['amount'], 2) + round($data['fees'] ?? 0, 2)),
            'currency' => $data['currency'],
            'paymentMethod' => $this->mapPaymentMethodToSerdiPay($data['payment_method']),
            'userId' => $data['user_id'] ?? null,
            'walletId' => $data['wallet_id'] ?? null,
            'email' => $data['email'] ?? null,
            'description' => $description,
            'tempId' => $tempId,
            'cardDetails' => $data['payment_type'] === 'credit-card' ? $data['payment_details'] : null
        ];
    }

    /**
     * Initie un paiement pour l'achat d'un pack par un utilisateur authentifié
     * Gère à la fois les paiements via solifin-wallet (traitement direct) et les autres méthodes (via SerdiPay)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiatePayment(Request $request)
    {
        // \Log::info($request->all());
        // return response()->json([
        //     'success' => false,
        //     'message' => 'Achat de pack en test',
        // ], 422);
        try {
            $validator = Validator::make($request->all(), [
                'transaction_type' => 'required|string',
                'payment_method' => 'required|string',
                'payment_type' => 'required|string',
                'payment_details'=> 'nullable|array',
                'referralCode' => 'nullable|string', // Rendre le code de parrainage optionnel
                'duration_months' => 'nullable|integer|min:1',
                'amount' => 'required|numeric|min:0',
                'fees' => 'required|numeric|min:0',
                'currency' => 'required|string',
            ]);
            
            // Ajouter des validations conditionnelles manuellement
            if ($request->input('payment_type') === 'mobile-money') {
                if (empty($request->input('payment_details.phoneNumber'))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Le numéro de téléphone est requis pour le paiement par mobile money'
                    ], 422);
                }
            }
            
            if (in_array($request->input('transaction_type'), ['purchase_pack', 'renew_pack'])) {
                if (empty($request->input('duration_months'))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La durée en mois est requise pour l\'achat ou le renouvellement d\'un pack'
                    ], 422);
                }

                if (empty($request->input('packId'))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'L\'identifiant du pack est requis pour l\'achat ou le renouvellement d\'un pack'
                    ], 422);
                }
            }
            
            if (in_array($request->input('payment_type'), ['credit-card', 'mobile-money'])) {
                if (empty($request->input('payment_details'))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Les détails de paiement sont requis pour ce mode de paiement'
                    ], 422);
                }
            }
            
            // Exécuter la validation et récupérer les données validées
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $validated = $validator->validated();

            if ($request->input('packId')) {
                $validated['packId'] = $request->input('packId');
            }
            
            // Vérifier que l'utilisateur est authentifié
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }
            
            // Vérifier le code de parrainage seulement s'il est fourni
            if (!empty($validated['referralCode']) && $validated['referralCode'] !== 'ADMIN') {
                // Vérifier que le code existe
                $request->validate([
                    'referralCode' => 'exists:user_packs,referral_code',
                ]);
                
                // Vérifier que l'utilisateur ne s'auto-parraine pas
                $sponsorPack = UserPack::where('referral_code', $validated['referralCode'])->first();
                if ($sponsorPack && $sponsorPack->user_id === $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas utiliser votre propre code de parrainage'
                    ], 422);
                }
            }

            $transaction_type = $validated['transaction_type'];
            switch ($transaction_type) {
                case 'purchase_pack':
                    // Vérifier que le pack existe
                    $pack = Pack::find($validated['packId']);
                    if (!$pack) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Pack non trouvé'
                        ]);
                    }

                    if (!$pack->status) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Pack non actif'
                        ]);
                    }

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
                    break;
                case 'renew_pack':
                    // Vérifier que le pack existe
                    $pack = Pack::find($validated['packId']);
                    
                    if (!$pack) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Pack non trouvé'
                        ], 404);
                    }

                    if (!$pack->status) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Pack non actif'
                        ], 404);
                    }

                    if ($validated['transaction_type'] === "renew_pack") {
                        // Vérifier si l'utilisateur a déjà ce pack
                        $userPack = UserPack::where('user_id', $request->user()->id)
                            ->where('pack_id', $pack->id)
                            ->first();
                        
                        if (!$userPack) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Vous n\'avez pas encore acheté ce pack'
                            ], 404);
                        }
                    }
                    break;
                case 'purchase_virtual':
                    $user = Auth::user();
                    $userWallet = $user->wallet;
                    
                    if (!$userWallet) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Portefeuille utilisateur non trouvé'
                        ], 404);
                    }
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Type de transaction non reconnu'
                    ], 400);
            }
            

            $paymentMethod = $validated['payment_method']; // Méthode spécifique (visa, m-pesa, etc.)
            $paymentType = $validated['payment_type']; // Type général (credit-card, mobile-money, etc.)
            $paymentAmount = $validated['amount']; // Montant sans les frais
            $paymentCurrency = $validated['currency'] ?? 'USD';
            
            // Calculer les frais de transaction (globaux et spécifiques à l'API)
            $feesResult = $this->calculateFees($paymentMethod, $paymentAmount, $paymentCurrency);
            
            if (!$feesResult['transactionFeeModel']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette méthode de paiement n\'est pas disponible'
                ], 404);
            }
            
            $frais_de_transaction = $feesResult['globalFees'];
            $transactionFee = $feesResult['transactionFeeModel'];
            
            // Log des frais calculés
            \Log::info('Frais calculés', [
                'montant' => $paymentAmount,
                'frais_de_transaction' => $frais_de_transaction,
            ]);
            
            // Montant total incluant les frais de transaction
            $totalAmount = $paymentAmount + $frais_de_transaction;
            

            // Vérifier le type de transaction pour la validation de pack
            if ($validated['transaction_type'] === "purchase_pack" || $validated['transaction_type'] === "renew_pack") {
                // Vérifier que le montant net est suffisant pour couvrir le coût du pack
                $paymentVerification = $this->verifyPackPayment($paymentAmount, $pack, $validated['duration_months'], $paymentCurrency);
                
                if (!$paymentVerification['success']) {
                    \Log::warning('Paiement insuffisant pour le pack', [
                        'montant_en_usd' => $paymentAmount,
                        'cout_pack' => $paymentVerification['packCost'],
                        'difference' => $paymentVerification['packCost'] - $paymentAmount
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => $paymentVerification['message']
                    ], 400);
                }
                
                $packCost = $paymentVerification['packCost'];
                $step = $paymentVerification['step'];
                $periods = $paymentVerification['periods'];
                
                \Log::info('Vérification du coût du pack réussie', [
                    'prix_pack' => $pack->price,
                    'duree_mois' => $validated['duration_months'],
                    'pas_abonnement' => $step,
                    'periodes' => $periods,
                    'cout_total' => $packCost,
                ]);
            }

            // Si la méthode de paiement est solifin-wallet, traiter directement l'achat
            if ($validated['payment_method'] === 'orange-money') {
                $purchaseData = [
                    'user_id' => $user->id,
                    'pack_id' => $pack->id,
                    'duration_months' => $validated['duration_months'],
                    'referral_code' => $validated['referralCode'] ?? null,
                    'amount' => $validated['amount'],
                    'fees' => $frais_de_transaction,
                    'currency' => $validated['currency'],
                    'payment_method' => $validated['payment_method'],
                    'payment_type' => $validated['payment_type'],
                    'payment_details' => $validated['payment_details'],
                    'phoneNumber' => $validated['payment_details']['phoneNumber'],
                ];
                $purchaseData = new Request($purchaseData);

                if ($validated['transaction_type'] === "purchase_pack") {
                    // Utiliser le contrôleur PackController pour traiter l'achat
                    $packController = app()->make(\App\Http\Controllers\User\PackController::class);
                    return $packController->purchase_a_new_pack($purchaseData);
                } elseif ($validated['transaction_type'] === "renew_pack") {
                    // Utiliser le contrôleur PackController pour traiter le renouvellement
                    $packController = app()->make(\App\Http\Controllers\User\PackController::class);
                    return $packController->renewPack($purchaseData);
                }
            } else {
                // Pour les autres méthodes de paiement, utiliser SerdiPay
                // Convertir la méthode de paiement au format SerdiPay
                $methode_paiement = $this->mapPaymentMethodToSerdiPay($validated['payment_method']);
                if (!$methode_paiement) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Méthode de paiement non supportée'
                    ], 400);
                }

                // Préparer les détails de paiement en fonction du type
                $paymentDetails = [];
                if ($validated['payment_type'] === 'mobile-money') {
                    // Pour mobile money, extraire le numéro de téléphone
                    if (empty($validated['payment_details']['phoneNumber'])) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Numéro de téléphone requis pour le paiement mobile'
                        ], 400);
                    }
                    
                    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
                    $phoneNumber = preg_replace('/\D/', '', $validated['payment_details']['phoneNumber']);
                    
                    // Vérifier le format du numéro (243 suivi de 9 chiffres)
                    if (!preg_match('/^243\d{9}$/', $phoneNumber)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Format de numéro de téléphone invalide. Format attendu: 243XXXXXXXXX'
                        ], 400);
                    }
                    
                    $validated['phoneNumber'] = $phoneNumber;
                } elseif ($validated['payment_type'] === 'credit-card') {
                    // Pour carte de crédit, vérifier les détails de la carte
                    $requiredFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'];
                    foreach ($requiredFields as $field) {
                        if (empty($validated['payment_details'][$field])) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Champ requis manquant: ' . $field
                            ], 400);
                        }
                    }
                }
                
                // Générer un ID temporaire unique pour cette transaction
                $tempPurchaseId = uniqid('purchase_', true);
            
                // Stocker les données d'achat temporairement
                $purchaseData = [
                    'user_id' => $user->id,
                    'pack_id' => isset($pack) ? $pack->id : null,
                    'duration_months' => $validated['duration_months'] ?? null,
                    'referral_code' => $validated['referralCode'] ?? null,
                    'amount' => $validated['amount'],
                    'fees' => $frais_de_transaction,
                    'currency' => $validated['currency'],
                    'payment_method' => $validated['payment_method'],
                    'payment_type' => $validated['payment_type'],
                    'payment_details' => $validated['payment_details'],
                    'phoneNumber' => $validated['payment_details']['phoneNumber'],
                    'email' => $user->email,
                    'wallet_id' => $user->wallet->id,
                ];
                
                // Créer une entrée dans la table purchase_temp
                $id = DB::table('purchase_temp')->insertGetId([
                    'temp_id' => $tempPurchaseId,
                    'user_id' => $user->id,
                    'pack_id' => isset($validated['packId']) ? $validated['packId'] : null,
                    'transaction_type' => $validated['transaction_type'],
                    'purchase_data' => json_encode($purchaseData),
                    'created_at' => now(),
                    'status' => 'pending'
                ]);
                
                // Préparer les paramètres pour l'API SerdiPay
                if ($validated['transaction_type'] === "purchase_pack") {
                    $description = 'Achat du pack #' . $pack->name;
                } elseif ($validated['transaction_type'] === "renew_pack") {
                    $description = 'Renouvellement du pack #' . $pack->name;
                } elseif ($validated['transaction_type'] === "purchase_virtual") {
                    $description = 'Achat des virtuels solifin';
                }
                $serdiPayParams = $this->prepareSerdiPayParams($purchaseData, $tempPurchaseId, $description);
                
                // Initier le paiement via SerdiPay
                $result = $this->serdiPayService->initiatePayment(
                    $serdiPayParams['phoneNumber'],
                    $serdiPayParams['amount'],
                    $serdiPayParams['currency'],
                    $serdiPayParams['paymentMethod'],
                    $serdiPayParams['userId'],
                    $serdiPayParams['walletId'],
                    $serdiPayParams['email'],
                    $serdiPayParams['description'],
                    $serdiPayParams['tempId'],
                    $serdiPayParams['cardDetails']
                );
                
                // Vérifier le résultat de l'initialisation du paiement
                if (!$result['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $result['message'] ?? 'Erreur lors de l\'initialisation du paiement'
                    ], 400);
                }
                
                // Mettre à jour l'enregistrement temporaire avec l'ID de session SerdiPay
                DB::table('purchase_temp')
                    ->where('id', $id)
                    ->update([
                        'session_id' => $result['session_id'] ?? null,
                        'transaction_id' => $result['transaction_id'] ?? null
                    ]);
                
                // Retourner la réponse avec les informations nécessaires pour le frontend
                return response()->json([
                    'success' => true,
                    'message' => 'Paiement initié avec succès',
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'initiation du paiement: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement de votre demande'
            ], 500);
        }
    }
    
    
    /**
     * Finalise l'achat d'un pack après confirmation du paiement SerdiPay
     *
     * @param object $tempPurchase Données temporaires de l'achat
     * @return bool Succès ou échec de la finalisation
     */
    private function finalizePurchase($tempPurchase, $typeOfTransaction)
    {
        try {
            // Récupérer les données d'achat
            $purchaseData = json_decode($tempPurchase->purchase_data, true);
            if (!$purchaseData) {
                throw new \Exception('Données d\'achat invalides');
                \Log::error('Données d\'achat invalides');
            }
        
            $purchaseData = new Request($purchaseData);

            if ($typeOfTransaction === 'purchase_pack') {
                // Utiliser le contrôleur PackController pour traiter l'achat
                $packController = app()->make(\App\Http\Controllers\User\PackController::class);
                return $packController->purchase_a_new_pack($purchaseData);
            } elseif ($typeOfTransaction === 'renew_pack') {
                // Utiliser le contrôleur PackController pour traiter le renouvellement
                $packController = app()->make(\App\Http\Controllers\User\PackController::class);
                return $packController->renewPack($purchaseData);
            } elseif ($typeOfTransaction === 'purchase_virtual') {
                // Utiliser le contrôleur WalletUserController pour traiter l'achat de virtuel
                $walletUserController = app()->make(\App\Http\Controllers\User\WalletUserController::class);
                return $walletUserController->purchaseVirtual($purchaseData);
            }
            
        } catch (\Exception $e) {
            // Enregistrer l'erreur et marquer l'achat comme échoué
            Log::error('Erreur lors de la finalisation de l\'achat: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            // Générer un token de reprise unique
            $retryToken = Str::random(32);
            
            // Mettre à jour l'enregistrement temporaire avec l'erreur et le token de reprise
            DB::table('purchase_temp')
                ->where('id', $tempPurchase->id)
                ->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'retry_token' => $retryToken,
                    'payment_confirmed' => true
                ]);
            
            return false;
        }
    }
    
    /**
     * Traite le résultat de la finalisation et détermine si l'opération a réussi
     * 
     * @param mixed $response Réponse de la méthode de finalisation
     * @param object $tempRecord Enregistrement temporaire
     * @return bool Succès ou échec de l'opération
     */
    private function processFinalizationResult($response, $tempRecord)
    {
        // Si la réponse est un objet Response de Laravel
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            $responseData = json_decode($response->getContent(), true);
            return $responseData['success'] ?? false;
        }
        
        // Si la réponse est déjà un booléen
        if (is_bool($response)) {
            return $response;
        }
        
        // Par défaut, considérer comme un échec
        return false;
    }

    /**
     * Gère le callback de SerdiPay
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handleCallback(Request $request)
    {
        try {
            Log::info('Callback SerdiPay reçu', $request->all());

            // Valider la structure du callback
            $validator = Validator::make($request->all(), [
                'status' => 'required|string',
                'message' => 'required|string',
                'payment.sessionId' => 'required|string',
                'payment.status' => 'required|string',
                'payment.transactionId' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                Log::error('Structure de callback SerdiPay invalide', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Structure de callback invalide'
                ], 400);
            }

            // Extraire les données du callback
            $status = $request->input('status');
            $message = $request->input('message');
            $sessionId = $request->input('payment.sessionId');
            $paymentStatus = $request->input('payment.status');
            $transactionId = $request->input('payment.transactionId');

            // Traiter le callback avec le service SerdiPay
            $result = $this->serdiPayService->handleCallback($request->all());
            
            $type = $result['type'];

            if ($type === 'payment') {
                // Envoyer notification de statut de paiement
                $this->sendPaymentStatusNotification($status, $paymentStatus, $sessionId);   
            }

            // Si le paiement est réussi, finaliser l'achat
            if ($status === 'success' && $paymentStatus === 'success') {    
                if ($type === 'payment') {
                    $tempPurchase = DB::table('purchase_temp')
                        ->where('session_id', $sessionId)
                        ->first();

                    if ($tempPurchase && empty($tempPurchase->completed_at)) {
                        $success = false;
                        
                        if ($tempPurchase->transaction_type === "purchase_pack") {
                            // Finaliser l'achat de pack et capturer le résultat
                            $response = $this->finalizePurchase($tempPurchase, 'purchase_pack');
                            $success = $this->processFinalizationResult($response, $tempPurchase);
                        } elseif ($tempPurchase->transaction_type === "renew_pack") {
                            // Finaliser le renouvellement de pack et capturer le résultat
                            $response = $this->finalizePurchase($tempPurchase, 'renew_pack');
                            $success = $this->processFinalizationResult($response, $tempPurchase);
                        }elseif ($tempPurchase->transaction_type === "purchase_virtual") {
                            // Finaliser l'achat des virtuels
                            $response = $this->finalizePurchase($tempPurchase, 'purchase_virtual');
                            $success = $this->processFinalizationResult($response, $tempPurchase);
                        }
                        
                        // Mettre à jour l'enregistrement temporaire en fonction du résultat
                        if ($success) {
                            DB::table('purchase_temp')
                                ->where('id', $tempPurchase->id)
                                ->update([
                                    'completed_at' => now(),
                                    'status' => 'completed'
                                ]);
                        }                           
                        // Envoyer notification de transaction (réussie ou échouée)
                        $this->sendTransactionNotification($tempPurchase, $success);
                    }
                }else {
                    $withdrawal = WithdrawalRequest::where('session_id', $sessionId)->whereNull('paid_at')->first();
                    if ($withdrawal) {
                        $withdrawal->update([
                            'paid_at' => now(),
                            'payment_status' => 'paid'
                        ]);
                    }

                    $withdrawal->user->wallet->transaction->where('type', 'withdrawal')->where('metadata->withdrawal_request_id', $withdrawal->id)->update([
                        'status' => 'completed'
                    ]);

                    $transaction_system = WalletSystemTransaction::where('type', 'withdrawal')->where('metadata->withdrawal_id', $withdrawal->id)->first();
                    if ($transaction_system) {
                        $transaction_system->update([
                            'status' => 'completed'
                        ]);
                    }

                    //Envoyer la notification de retrait effectué
                    $withdrawal->user->notify(new WithdrawalRequestPaid($withdrawal));

                    //Payer la commission
                    $withdrawalService = app(WithdrawalService::class);
                    //c'est le premier sponsor de l'utilisateur qui touche la commission de retrait
                    $firstuserpack = UserPack::where('user_id', $withdrawal->user->id)->first();
                    $withdrawalService->paySponsorCommission($firstuserpack->sponsor, $withdrawal->payment_details['frais_de_commission'], $withdrawal);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Callback traité avec succès'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors du traitement du callback: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement du callback'
            ], 500);
        }
    }
    
    /**
     * Envoie une notification concernant le statut du paiement
     * 
     * @param string $status Le statut global du paiement
     * @param string $paymentStatus Le statut spécifique du paiement
     * @param string $sessionId L'identifiant de session du paiement
     * @return void
     */
    private function sendPaymentStatusNotification($status, $paymentStatus, $sessionId)
    {
        try {
            $tempPurchase = DB::table('purchase_temp')
                ->where('session_id', $sessionId)
                ->first();
                
            if ($tempPurchase && !empty($tempPurchase->user_id)) {
                $user = User::find($tempPurchase->user_id);
                
                if ($user) {
                    $amount = $tempPurchase->amount ?? 0;
                    $currency = $tempPurchase->currency ?? 'USD';
                    $transactionType = $tempPurchase->transaction_type ?? null;
                    
                    // Envoyer notification à l'utilisateur
                    $user->notify(new PaymentStatusNotification(
                        $amount,
                        $currency,
                        $sessionId,
                        $status === 'success' && $paymentStatus === 'success' ? 'success' : 'failed',
                        $transactionType
                    ));
                }
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de la notification de statut de paiement: ' . $e->getMessage(), [
                'exception' => $e,
                'session_id' => $sessionId
            ]);
        }
    }
    
    /**
     * Envoie une notification concernant la transaction (achat ou renouvellement)
     * 
     * @param object $tempPurchase Les données temporaires de l'achat
     * @param bool $success Indique si la transaction a réussi
     * @return void
     */
    private function sendTransactionNotification($tempPurchase, $success)
    {
        try {
            if (empty($tempPurchase->user_id)) {
                return;
            }
            
            $user = User::find($tempPurchase->user_id);
            
            if (!$user) {
                return;
            }
            
            $transactionData = json_decode($tempPurchase->purchase_data);
            $amount = $tempPurchase->amount ?? 0;
            $currency = $tempPurchase->currency ?? 'USD';
            $transactionType = $tempPurchase->transaction_type;
            
            // Envoyer notification de transaction (email + database)
            $user->notify(new TransactionNotification(
                $transactionData,
                $amount,
                $currency,
                $transactionType,
                $success
            ));
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de la notification de transaction: ' . $e->getMessage(), [
                'exception' => $e,
                'purchase_id' => $tempPurchase->id ?? null,
                'transaction_type' => $tempPurchase->transaction_type ?? null
            ]);
        }
    }
}
