<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SerdiPayService;
use Illuminate\Support\Facades\Auth;
use App\Models\Wallet;
use App\Models\User;
use App\Models\RegistrationTemp;
use App\Models\Pack;
use App\Models\TransactionFee;
use App\Models\ExchangeRates;
use App\Models\Setting;
use App\Models\WalletTransaction;
use App\Models\WalletSystemTransaction;
use App\Models\SerdiPayTransaction;
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
            $withdrawal->save();
                
            // Enregistrer la transaction dans le wallet system
            $walletService = app(\App\Services\WalletService::class);
            $walletSystem = \App\Models\WalletSystem::firstOrCreate([
                'balance' => 0,
                'total_in' => 0,
                'total_out' => 0,
            ]);
            
            $walletService->recordSystemTransaction([
                'amount' => $withdrawal->payment_details['montant_a_retirer_en_USD'],
                'type' => 'withdrawal',
                'status' => self::STATUS_PENDING,
                'metadata' => [
                    'user' => $withdrawal->user->name,
                    'withdrawal_id' => $withdrawal->id,
                    'phone_number' => $phoneNumber,
                    'Méthode de paiement' => $paymentMethod,
                    'Montant à retirer' => $withdrawal->payment_details['montant_a_retirer'],
                    'Devise' => $withdrawal->payment_details['devise'],
                    'Taux de change appliqué' => $withdrawal->payment_details['taux_de_change'],
                    'Frais de transaction' => $withdrawal->payment_details['frais_de_retrait'] . ' $',
                    'Frais de commission' => $withdrawal->payment_details['frais_de_commission'] . ' $',
                    'Frais API' => $withdrawal->payment_details['frais_api'] . ' $',
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
     * Convertit une somme d'argent en USD
     *
     * @param float $amount Montant à convertir
     * @param string $currency Devise de la somme à convertir
     * @return float Montant converti en USD
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
            'specificFees' => 0,
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
            
            // Calcul des frais spécifiques à l'API de paiement
            $result['specificFees'] = round($transactionFeeModel->calculateTransferFee((float) $paymentAmount, $paymentCurrency), 2);
        }
        
        return $result;
    }
    
    /**
     * Convertit les montants dans la devise de base (USD)
     *
     * @param array $amounts Tableau des montants à convertir
     * @param string $currency Devise source
     * @return array Tableau contenant les montants convertis et le taux de change
     */
    private function convertAmountsToUSD($amounts, $currency)
    {
        $result = [
            'convertedAmounts' => [],
            'exchangeRate' => 0,
            'success' => true,
            'message' => ''
        ];
        
        // Si déjà en USD, pas besoin de conversion
        if ($currency === 'USD') {
            $result['convertedAmounts'] = $amounts;
            return $result;
        }
        
        try {
            // Récupérer le taux de change
            $exchangeRate = ExchangeRates::where('currency', $currency)
                ->where("target_currency", "USD")
                ->first();
                
            if (!$exchangeRate) {
                $result['success'] = false;
                $result['message'] = 'Taux de change non disponible pour cette devise';
                return $result;
            }
            
            $result['exchangeRate'] = $exchangeRate->rate;
            
            // Convertir chaque montant
            foreach ($amounts as $key => $amount) {
                $result['convertedAmounts'][$key] = $this->convertToUSD($amount, $currency);
            }
            
        } catch (\Exception $e) {
            $result['success'] = false;
            $result['message'] = "Impossible d'utiliser cette monnaie, veuillez payer en USD pour plus de simplicité";
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
    private function verifyPackPayment($netAmount, $pack, $durationMonths)
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
        
        // Calculer le nombre de périodes d'abonnement
        $periods = ceil($durationMonths / $step);
        $result['periods'] = $periods;
        
        // Le coût total est le prix du pack multiplié par le nombre de périodes
        $packCost = $pack->price * $periods;
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
            'amount' => round($data['amount'], 2) + round($data['fees'] ?? 0, 2),
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
     * Initie un paiement via SerdiPay pour un utilisateur non authentifié (inscription)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiateGuestPayment(Request $request)
    {
        // Valider les données de la requête
        // Inclure toutes les validations critiques qui pourraient bloquer l'inscription
        $registrationData = json_decode($request->registration_data, true) ?: [];
        
        // Fusionner les données d'inscription avec les données de la requête pour la validation
        $dataToValidate = array_merge($registrationData, $request->all());
        
        $validator = Validator::make($dataToValidate, [
            // Données de paiement
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
            'phone_number' => 'required|string',
            'payment_method' => 'required|string',
            'payment_type' => 'required|string|in:mobile-money,credit-card',
            'payment_details' => 'required|array',
            
            // Données utilisateur critiques
            'email' => 'required|email|unique:users',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'address' => 'required|string',
            'phone' => 'required|string',
            'whatsapp' => 'nullable|string',
            'gender' => 'required|string',
            'country' => 'required|string',
            'province' => 'required|string',
            'city' => 'required|string',
            
            // Données d'inscription
            'registration_data' => 'required|json',
            'pack_id' => 'required|integer|exists:packs,id',
            'duration_months' => 'required|integer|min:1',
            'sponsor_code' => 'required|exists:user_packs,referral_code',
            'invitation_code' => 'nullable|string',
            'acquisition_source' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        // Démarrer une transaction DB pour assurer l'intégrité des données
        DB::beginTransaction();

        try {
            // Récupérer le pack
            $pack = Pack::find($request->pack_id);
            if (!$pack) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pack non trouvé'
                ], 404);
            }

            // Récupérer les informations de paiement
            $paymentMethod = $request->payment_method;
            $paymentType = $request->payment_type;
            $paymentAmount = $request->amount;
            $paymentCurrency = $request->currency;
            $paymentDetails = $request->payment_details;
            
            // Calculer les frais de transaction (globaux et spécifiques à l'API)
            $feesResult = $this->calculateFees($paymentMethod, $paymentAmount, $paymentCurrency);
            
            if (!$feesResult['transactionFeeModel']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cette méthode de paiement n\'est pas encore disponible'
                ], 400);
            }
            
            $frais_de_transaction = $feesResult['globalFees']; // Frais globaux
            $frais_api = $feesResult['specificFees']; // Frais spécifiques à l'API
            $transactionFee = $feesResult['transactionFeeModel'];
            
            // Log des frais calculés
            \Log::info('Frais calculés pour inscription invité', [
                'montant' => $paymentAmount,
                'frais_de_transaction' => $frais_de_transaction,
                'frais_api' => $frais_api
            ]);
            
            // Montant total incluant les frais globaux
            $totalAmount = $paymentAmount + $frais_de_transaction;
            
            // Convertir les montants en USD si nécessaire
            $amountsToConvert = [
                'totalAmount' => $totalAmount,
                'frais_de_transaction' => $frais_de_transaction,
                'frais_api' => $frais_api
            ];
            
            $conversionResult = $this->convertAmountsToUSD($amountsToConvert, $paymentCurrency);
            
            if (!$conversionResult['success']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $conversionResult['message']
                ], 400);
            }
            
            $amountInUSD = $conversionResult['convertedAmounts']['totalAmount'];
            $frais_de_transaction_in_usd = $conversionResult['convertedAmounts']['frais_de_transaction'];
            $frais_api_in_usd = $conversionResult['convertedAmounts']['frais_api'];
            $taux_de_change = $conversionResult['exchangeRate'];
            
            // Calcul des montants nets (sans les frais)
            $montantusd_sans_frais_api = round($amountInUSD - $frais_api_in_usd, 2);
            $montantusd_sans_frais = round($amountInUSD - $frais_de_transaction_in_usd, 2);
            
            // Log des montants nets calculés
            \Log::info('Montants nets calculés pour inscription invité', [
                'montant_total_usd' => $amountInUSD,
                'montant_sans_frais_api' => $montantusd_sans_frais_api,
                'montant_sans_frais' => $montantusd_sans_frais
            ]);
            
            // Vérifier que le montant net est suffisant pour couvrir le coût du pack
            $paymentVerification = $this->verifyPackPayment($montantusd_sans_frais, $pack, $request->duration_months);
            
            if (!$paymentVerification['success']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $paymentVerification['message'],
                    'details' => [
                        'montant_sans_frais' => $montantusd_sans_frais,
                        'cout_pack' => $paymentVerification['packCost'],
                        'difference' => $paymentVerification['packCost'] - $montantusd_sans_frais
                    ]
                ], 400);
            }
            
            $packCost = $paymentVerification['packCost'];
            $step = $paymentVerification['step'];
            $periods = $paymentVerification['periods'];

            // Stocker temporairement les données d'inscription
            $registrationData = json_decode($request->registration_data, true);
            $tempRegistrationId = uniqid('reg_');
            
            // Enrichir les données d'inscription avec les calculs effectués
            $registrationData['amount'] = $paymentAmount;
            $registrationData['fees'] = $frais_de_transaction;
            $registrationData['frais_api'] = $frais_api;
            $registrationData['currency'] = $paymentCurrency;
            $registrationData['amountInUSD'] = $amountInUSD;
            $registrationData['frais_de_transaction_in_usd'] = $frais_de_transaction_in_usd;
            $registrationData['frais_api_in_usd'] = $frais_api_in_usd;
            $registrationData['montantusd_sans_frais_api'] = $montantusd_sans_frais_api;
            $registrationData['montantusd_sans_frais'] = $montantusd_sans_frais;
            $registrationData['taux_de_change'] = $taux_de_change;
            $registrationData['packCost'] = $packCost;
            
            // Préparer les données calculées pour les stocker
            $calculatedData = [
                'amountInUSD' => $amountInUSD,
                'frais_de_transaction_in_usd' => $frais_de_transaction_in_usd,
                'frais_api_in_usd' => $frais_api_in_usd,
                'montantusd_sans_frais_api' => $montantusd_sans_frais_api,
                'montantusd_sans_frais' => $montantusd_sans_frais,
                'packCost' => $packCost,
                'frais_api' => $frais_api,
                'taux_de_change' => $taux_de_change
            ];
            
            // Stocker les données d'inscription temporairement
            $id = DB::table('registration_temp')->insertGetId([
                'temp_id' => $tempRegistrationId,
                'session_id' => null,
                'email' => $request->email,
                'pack_id' => $request->pack_id,
                'registration_data' => json_encode($registrationData),
                'calculated_data' => json_encode($calculatedData),
                'created_at' => now(),
                'status' => 'pending'
            ]);

            // Préparer les données pour l'appel à l'API SerdiPay
            $paymentData = [
                'payment_method' => $request->payment_method,
                'payment_type' => $request->payment_type,
                'amount' => $request->amount,
                'fees' => $frais_de_transaction, // frais globaux
                'currency' => $request->currency,
                'phoneNumber' => $request->payment_details['fullPhoneNumber'],
                'email' => $request->email,
                'payment_details' => $request->payment_type === 'credit-card' ? $request->payment_details : null
            ];
            
            // Préparer les paramètres pour l'API SerdiPay
            $serdiPayParams = $this->prepareSerdiPayParams($paymentData, $tempRegistrationId, 'Inscription et achat de pack');
            
            // Initier le paiement via SerdiPay
            $result = $this->serdiPayService->initiatePayment(
                $serdiPayParams['phoneNumber'],
                $serdiPayParams['amount'],
                $serdiPayParams['currency'],
                $serdiPayParams['paymentMethod'],
                null, // user_id (null car utilisateur non authentifié)
                null, // wallet_id (null car utilisateur non authentifié)
                $serdiPayParams['email'],
                $serdiPayParams['description'],
                $serdiPayParams['tempId'],
                $serdiPayParams['cardDetails']
            );

            // Si l'initiation du paiement a réussi, mettre à jour la table temporaire
            if (isset($result['success']) && $result['success']) {
                DB::table('registration_temp')
                    ->where('temp_id', $tempRegistrationId)
                    ->update([
                        'session_id' => $result['session_id'],
                        'transaction_id' => $result['transaction_id'] ?? null
                    ]);
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Paiement initié avec succès',
                    'data' => [
                        'session_id' => $result['session_id'],
                        'temp_registration_id' => $tempRegistrationId,
                        'payment_type' => $request->payment_type
                    ]
                ]);
            } else {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Erreur lors de l\'initiation du paiement'
                ], $result['status_code'] ?? 500);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de l\'initiation du paiement invité: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement de votre demande'
            ], 500);
        }
    }

    /**
     * Vérifie le statut d'une transaction SerdiPay pour l'achat d'un pack pour une inscription
     *
     * @param string $transactionId
     * @return \Illuminate\Http\JsonResponse
     * @deprecated Utiliser checkTransactionStatus avec le paramètre type='registration' à la place
     */
    public function checkGuestStatus($transactionId)
    {
        return $this->checkTransactionStatus($transactionId, 'registration');
    }

    /**
     * Finalise l'inscription après confirmation du paiement
     *
     * @param object $tempRegistration
     * @return void
     */
    private function finalizeRegistration($tempRegistration)
    {
        try {
            DB::beginTransaction();

            // Récupérer les données d'inscription
            $registrationData = json_decode($tempRegistration->registration_data, true);
            $packId = $tempRegistration->pack_id;

            // Vérifier si les données nécessaires sont présentes
            if (!isset($registrationData['name']) || !isset($registrationData['email']) || 
                !isset($registrationData['password']) || !isset($registrationData['password_confirmation'])) {
                throw new \Exception('Données d\'inscription incomplètes');
            }

            // Marquer le paiement comme confirmé (même si l'inscription échoue, le paiement est validé)
            DB::table('registration_temp')
                ->where('temp_id', $tempRegistration->temp_id)
                ->update([
                    'payment_confirmed' => true,
                    'payment_confirmed_at' => now()
                ]);
            
            // Créer la requête avec toutes les données
            $request = new Request($registrationData);
            
            // Appeler le RegisterController pour finaliser l'inscription
            // Nous passons les données pré-validées et pré-calculées
            $registerController = app(\App\Http\Controllers\Auth\RegisterController::class);
            $result = $registerController->register($request, $packId);
            
            // Vérifier si l'inscription a réussi
            $resultData = json_decode($result->getContent(), true);
            
            if (isset($resultData['success']) && $resultData['success']) {
                // Marquer l'inscription comme complétée
                DB::table('registration_temp')
                    ->where('temp_id', $tempRegistration->temp_id)
                    ->update([
                        'completed_at' => now(),
                        'status' => 'completed',
                        'error_message' => null,
                        'retry_token' => null // Effacer le token de reprise s'il existait
                    ]);
                
                Log::info('Inscription finalisée avec succès', [
                    'temp_id' => $tempRegistration->temp_id,
                    'email' => $tempRegistration->email
                ]);
            } else {
                // Générer un token de reprise unique pour permettre à l'utilisateur de réessayer sans payer
                $retryToken = \Illuminate\Support\Str::random(32);
                
                // Marquer l'inscription comme échouée mais avec un token de reprise
                DB::table('registration_temp')
                    ->where('temp_id', $tempRegistration->temp_id)
                    ->update([
                        'status' => 'failed',
                        'error_message' => $resultData['message'] ?? 'Erreur inconnue lors de l\'inscription',
                        'retry_token' => $retryToken,
                        'retry_count' => DB::raw('COALESCE(retry_count, 0) + 1'),
                        'last_retry_at' => now()
                    ]);
                
                Log::error('Erreur lors de la finalisation de l\'inscription, token de reprise généré', [
                    'temp_id' => $tempRegistration->temp_id,
                    'email' => $tempRegistration->email,
                    'error' => $resultData['message'] ?? 'Erreur inconnue',
                    'retry_token' => $retryToken
                ]);
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Générer un token de reprise unique en cas d'exception
            $retryToken = \Illuminate\Support\Str::random(32);
            
            // Marquer l'inscription comme échouée mais avec un token de reprise
            DB::table('registration_temp')
                ->where('temp_id', $tempRegistration->temp_id)
                ->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'retry_token' => $retryToken,
                    'retry_count' => DB::raw('COALESCE(retry_count, 0) + 1'),
                    'last_retry_at' => now(),
                    'payment_confirmed' => true, // Le paiement est confirmé même si l'inscription a échoué
                    'payment_confirmed_at' => now()
                ]);
            
            Log::error('Exception lors de la finalisation de l\'inscription, token de reprise généré: ' . $e->getMessage(), [
                'temp_id' => $tempRegistration->temp_id,
                'email' => $tempRegistration->email,
                'trace' => $e->getTraceAsString(),
                'retry_token' => $retryToken
            ]);
        }
    }

    /**
     * Permet à l'utilisateur de réessayer son inscription après un échec
     * en utilisant un token de reprise (sans avoir à payer à nouveau)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function retryRegistration(Request $request)
    {
        try {
            // Valider les données de la requête
            $validator = Validator::make($request->all(), [
                'retry_token' => 'required|string|size:32',
                'email' => 'required|email',
                'registration_data' => 'required|json'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            // Récupérer l'enregistrement temporaire correspondant au token de reprise
            $tempRegistration = DB::table('registration_temp')
                ->where('retry_token', $request->retry_token)
                ->where('email', $request->email)
                ->where('payment_confirmed', true)
                ->where('status', 'failed')
                ->first();

            if (!$tempRegistration) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token de reprise invalide ou expiré'
                ], 404);
            }

            // Vérifier si l'inscription n'a pas déjà été complétée entre-temps
            if ($tempRegistration->completed_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette inscription a déjà été complétée'
                ], 400);
            }

            // Mettre à jour les données d'inscription avec les nouvelles données fournies
            $newRegistrationData = json_decode($request->registration_data, true);
            $oldRegistrationData = json_decode($tempRegistration->registration_data, true);
            $calculatedData = json_decode($tempRegistration->calculated_data ?? '{}', true) ?: [];

            // Conserver les données de paiement et les montants calculés
            $preservedData = [
                'amount', 'amountInUSD', 'currency', 'fees', 'globalFeesInUSD', 'packCost',
                'payment_method', 'payment_type', 'payment_details', 'phoneNumber'
            ];

            // Fusionner les nouvelles données tout en préservant les données de paiement
            foreach ($preservedData as $key) {
                if (isset($oldRegistrationData[$key])) {
                    $newRegistrationData[$key] = $oldRegistrationData[$key];
                }
            }

            // Mettre à jour les données d'inscription
            DB::table('registration_temp')
                ->where('temp_id', $tempRegistration->temp_id)
                ->update([
                    'registration_data' => json_encode($newRegistrationData),
                    'retry_count' => DB::raw('retry_count + 1'),
                    'last_retry_at' => now()
                ]);

            // Récupérer l'enregistrement mis à jour
            $updatedRegistration = DB::table('registration_temp')
                ->where('temp_id', $tempRegistration->temp_id)
                ->first();

            // Finaliser l'inscription avec les nouvelles données
            $this->finalizeRegistration($updatedRegistration);

            // Vérifier si l'inscription a réussi après la nouvelle tentative
            $updatedStatus = DB::table('registration_temp')
                ->where('temp_id', $tempRegistration->temp_id)
                ->first();

            if ($updatedStatus->status === 'completed') {
                return response()->json([
                    'success' => true,
                    'message' => 'Inscription finalisée avec succès',
                    'user_id' => $updatedStatus->user_id
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'inscription a échoué à nouveau',
                    'error' => $updatedStatus->error_message,
                    'retry_token' => $updatedStatus->retry_token
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors de la tentative de reprise d\'inscription: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la tentative de reprise d\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
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
        try {
            // Valider les données de la requête
            $validated = $request->validate([
                'transaction_type' => 'required|string:in(purchase_pack,renew_pack,purchase_virtual)',
                'packId' => 'required_if:transaction_type,purchase_pack,renew_pack|exists:packs,id',
                'payment_method' => 'required|string',
                'payment_type' => 'required|string',
                'payment_details'=> ['required_if:payment_type,credit-card,mobile-money', 'array'],
                'phoneNumber' => 'required_if:payment_type,mobile-money|string',
                'referralCode' => 'required_if:transaction_type,purchase_pack|exists:user_packs,referral_code', //code du sponsor
                'duration_months' => 'required_if:transaction_type,purchase_pack,renew_pack|integer|min:1',
                'amount' => 'required|numeric|min:0',
                'fees' => 'required|numeric|min:0',
                'currency' => 'required|string',
            ]);
            
            // Vérifier que l'utilisateur est authentifié
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            $transaction_type = $validated['transaction_type'];
            switch ($transaction_type) {
                case 'purchase_pack':
                    // Vérifier que le pack existe
                    $pack = Pack::where('id', $validated['packId'])->where('status', 'active')->first();
                    
                    if (!$pack) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Pack non trouvé ou non actif'
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
                    $pack = Pack::where('id', $validated['packId'])->where('status', 'active')->first();
                    
                    if (!$pack) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Pack non trouvé ou non actif'
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
                    'message' => 'Cette méthode de paiement n\'est pas encore disponible'
                ], 404);
            }
            
            $frais_de_transaction = $feesResult['globalFees']; // Frais globaux
            $frais_api = $feesResult['specificFees']; // Frais spécifiques à l'API
            $transactionFee = $feesResult['transactionFeeModel'];
            
            // Log des frais calculés
            \Log::info('Frais calculés', [
                'montant' => $paymentAmount,
                'frais_de_transaction' => $frais_de_transaction,
                'frais_api' => $frais_api
            ]);
            
            // Montant total incluant les frais de transaction
            $totalAmount = $paymentAmount + $frais_de_transaction;
            
            // Convertir les montants en USD si nécessaire
            $amountsToConvert = [
                'totalAmount' => $totalAmount,
                'frais_de_transaction' => $frais_de_transaction,
                'frais_api' => $frais_api
            ];
            
            $conversionResult = $this->convertAmountsToUSD($amountsToConvert, $paymentCurrency);
            
            if (!$conversionResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $conversionResult['message']
                ]);
            }
            
            $amountInUSD = $conversionResult['convertedAmounts']['totalAmount'];
            $frais_de_transaction_in_usd = $conversionResult['convertedAmounts']['frais_de_transaction'];
            $frais_api_in_usd = $conversionResult['convertedAmounts']['frais_api'];
            $taux_de_change = $conversionResult['exchangeRate'];
            
            // Calcul des montants nets (sans les différents types de frais)
            $montantusd_sans_frais_api = round($amountInUSD - $frais_api_in_usd, 2); // Montant total sans frais spécifiques à l'API
            $montantusd_sans_frais = round($amountInUSD - $frais_de_transaction_in_usd, 2); // Montant total sans frais globaux
            
            // Log des montants nets calculés
            \Log::info('Montants nets calculés', [
                'montant_total_usd' => $amountInUSD,
                'montant_sans_frais_api' => $montantusd_sans_frais_api,
                'montant_sans_frais' => $montantusd_sans_frais
            ]);

            // Vérifier le type de transaction pour la validation de pack
            if ($validated['transaction_type'] === "purchase_pack" || $validated['transaction_type'] === "renew_pack") {
                // Vérifier que le montant net est suffisant pour couvrir le coût du pack
                $paymentVerification = $this->verifyPackPayment($montantusd_sans_frais, $pack, $validated['duration_months']);
                
                if (!$paymentVerification['success']) {
                    \Log::warning('Paiement insuffisant pour le pack', [
                        'montant_sans_frais_globaux' => $montantusd_sans_frais,
                        'cout_pack' => $paymentVerification['packCost'],
                        'difference' => $paymentVerification['packCost'] - $montantusd_sans_frais
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
                    'montant_sans_frais_globaux' => $montantusd_sans_frais
                ]);
            }
            
            $purchaseData = [
                'user_id' => $user->id,
                'pack_id' => $pack->id,
                'duration_months' => $validated['duration_months'],
                'days' => $validated['days'],
                'referral_code' => $validated['referralCode'],
                'amount' => $validated['amount'],
                'fees' => $validated['fees'], // frais globaux définis dans les settings('purchase_fees')
                'frais_api' => $frais_api, // frais spécifiques à l'api de paiement définis dans transaction_fee
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'],
                'payment_type' => $validated['payment_type'],
                'payment_details' => $validated['payment_details'],
                'phoneNumber' => $validated['phoneNumber'],
                'amountInUSD' => $amountInUSD,
                'montantusd_sans_frais_api' => $montantusd_sans_frais_api,
                'montantusd_sans_frais' => $montantusd_sans_frais,
                'taux_de_change' => $taux_de_change,
            ];

            // Si la méthode de paiement est solifin-wallet, traiter directement l'achat
            if ($validated['payment_method'] === 'solifin-wallet') {
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
                    if (empty($validated['phoneNumber'])) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Numéro de téléphone requis pour le paiement mobile'
                        ], 400);
                    }
                    
                    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
                    $phoneNumber = preg_replace('/\D/', '', $validated['phoneNumber']);
                    
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
                    'duration_months' => $validated['duration_months'],
                    'referral_code' => $validated['referralCode'],
                    'amount' => $validated['amount'],
                    'fees' => $validated['fees'], // frais globaux définis dans les settings('purchase_fees')
                    'frais_api' => $frais_api, // frais spécifiques à l'api de paiement définis dans transaction_fee
                    'currency' => $validated['currency'],
                    'payment_method' => $validated['payment_method'],
                    'payment_type' => $validated['payment_type'],
                    'payment_details' => $validated['payment_details'],
                    'phoneNumber' => $validated['phoneNumber'],
                    'email' => $user->email,
                    'wallet_id' => $user->wallet->id,
                    'amountInUSD' => $amountInUSD,
                    'montantusd_sans_frais_api' => $montantusd_sans_frais_api,
                    'taux_de_change' => $taux_de_change
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
                    // 'transaction_id' => $result['transaction_id'] ?? null,
                    // 'session_id' => $result['session_id'] ?? null,
                    // 'redirect_url' => $result['redirect_url'] ?? null,
                    // 'payment_url' => $result['payment_url'] ?? null
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
     * Vérifie le statut d'une transaction SerdiPay (méthode générique)
     *
     * @param string $transactionId Identifiant de la transaction
     * @param string $type Type de transaction ('registration' ou 'purchase')
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkTransactionStatus($transactionId, $type = 'purchase')
    {
        try {
            // Vérifier que la transaction existe
            $transaction = SerdiPayTransaction::where('session_id', $transactionId)
                ->orWhere('transaction_id', $transactionId)
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction non trouvée'
                ], 404);
            }

            // Vérifier le statut de la transaction via SerdiPay
            $result = $this->serdiPayService->checkTransactionStatus($transaction->session_id);
            
            // Déterminer la table et les clés de réponse en fonction du type
            $tableName = $type === 'registration' ? 'registration_temp' : 'purchase_temp';
            $completedKey = $type === 'registration' ? 'registration_completed' : 'purchase_completed';
            $failedKey = $type === 'registration' ? 'registration_failed' : 'purchase_failed';
            $errorKey = $type === 'registration' ? 'registration_error' : 'purchase_error';
            $identifierKey = $type === 'registration' ? 'email' : 'user_id';
            
            // Vérifier si l'opération a été finalisée
            $tempRecord = DB::table($tableName)
                ->where('session_id', $transaction->session_id)
                ->first();
            
            $completed = false;
            $failed = false;
            $retryToken = null;
            $error = null;
            
            if ($tempRecord) {
                if ($tempRecord->completed_at) {
                    $completed = true;
                } elseif ($tempRecord->status === 'failed' && $tempRecord->payment_confirmed) {
                    // L'opération a échoué mais le paiement est confirmé
                    $failed = true;
                    $retryToken = $tempRecord->retry_token;
                    $error = $tempRecord->error_message;
                } elseif ($result['status'] === 'success' && !$tempRecord->completed_at && $type === 'purchase') {
                    // Le paiement est confirmé mais l'achat n'est pas encore finalisé (uniquement pour les achats)
                    // Déterminer le type de transaction (achat ou renouvellement)
                    $transactionType = $tempRecord->transaction_type ?? 'purchase_pack';
                    // Finaliser l'achat
                    $response = $this->finalizePurchase($tempRecord, $transactionType);
                    $success = $this->processFinalizationResult($response, $tempRecord);
                    
                    // Mettre à jour l'enregistrement temporaire en fonction du résultat
                    if ($success) {
                        DB::table('purchase_temp')
                            ->where('id', $tempRecord->id)
                            ->update([
                                'completed_at' => now(),
                                'status' => 'completed'
                            ]);
                        $completed = true;
                    }
                }
            }
            
            // Préparer la réponse
            $response = [
                'success' => $result['status'] === 'success' ? true : false,
                'message' => $result['message'],
                $completedKey => $completed,
                $failedKey => $failed,
                'retry_token' => $retryToken,
                $errorKey => $error
            ];
            
            // Ajouter l'identifiant spécifique au type
            if ($tempRecord) {
                $response[$identifierKey] = $tempRecord->{$identifierKey} ?? null;
            }
            
            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification du statut: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification du statut: ' . $e->getMessage()
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

            // Si le paiement est réussi, finaliser l'inscription si c'est un paiement d'inscription
            if ($status === 'success' && $paymentStatus === 'success') {    
                if ($type === 'payment') {
                    // Vérifier s'il s'agit d'une inscription
                    $tempRegistration = DB::table('registration_temp')
                        ->where('session_id', $sessionId)
                        ->first();

                    if ($tempRegistration && empty($tempRegistration->completed_at)) {
                        // Finaliser l'inscription
                        $this->finalizeRegistration($tempRegistration);
                    } else{
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
                    }
                }else {
                    $withdrawal = WithdrawalRequest::where('session_id', $sessionId)->whereNull('paid_at')->first();
                    if ($withdrawal) {
                        $withdrawal->update([
                            'paid_at' => now(),
                            'payment_status' => 'completed'
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
            // Récupérer les données de transaction temporaire
            $tempRegistration = DB::table('registration_temp')
                ->where('session_id', $sessionId)
                ->first();
                
            if ($tempRegistration) {
                // Pour une inscription, envoyer un email à l'adresse fournie
                if (!empty($tempRegistration->email)) {
                    $amount = $tempRegistration->amount ?? 0;
                    $currency = $tempRegistration->currency ?? 'USD';
                    
                    // Utiliser la méthode route pour envoyer une notification par email
                    \Illuminate\Support\Facades\Notification::route('mail', $tempRegistration->email)
                        ->notify(new PaymentStatusNotification(
                            $amount,
                            $currency,
                            $sessionId,
                            $status === 'success' && $paymentStatus === 'success' ? 'success' : 'failed'
                        ));
                }
                return;
            }
            
            // Si ce n'est pas une inscription, vérifier si c'est un achat
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
