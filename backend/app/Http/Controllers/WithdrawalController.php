<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Models\TransactionFee;
use App\Models\UserPack;
use App\Models\Pack;
use App\Models\WalletSystem;
use App\Models\WalletTransaction;
use App\Models\ExchangeRates;
use App\Models\Setting;
use App\Notifications\WithdrawalRequestCreated;
use App\Notifications\WithdrawalRequestProcessed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Controllers\Api\CurrencyController;

class WithdrawalController extends Controller
{
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_FAILED = 'failed';
    
    public function __construct()
    {
        // Constructeur simplifié - Service Vonage supprimé
    }
    
    /**
     * Récupère les demandes de retrait de l'utilisateur connecté
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserWithdrawalRequests(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Récupérer les paramètres de filtrage
            $status = $request->query('status');
            $paymentMethod = $request->query('payment_method');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $search = $request->query('search');
            $perPage = $request->query('per_page', 10);
            
            // Construire la requête
            $query = WithdrawalRequest::where('user_id', $user->id)
                ->with(['user'])
                ->orderBy('created_at', 'desc');
            
            // Appliquer les filtres
            if ($status) {
                $query->where('status', $status);
            }
            
            if ($paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            }
            
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
            
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhere('amount', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
            
            // Paginer les résultats
            $withdrawalRequests = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $withdrawalRequests,
                'message' => 'Demandes de retrait récupérées avec succès'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des demandes de retrait', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandes de retrait: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupère toutes les demandes de retrait (traitées ou non) Admin
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Récupérer les paramètres de filtrage
            $status = $request->query('status');
            $paymentMethod = $request->query('payment_method');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $search = $request->query('search');
            
            // Construire la requête de base
            $query = WithdrawalRequest::with(['user', 'processor'])
                ->orderBy('created_at', 'desc');
            
            // Appliquer les filtres si présents
            if ($status) {
                $query->where('status', $status);
            }
            
            if ($paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            }
            
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
            
            if ($search) {
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            
            // Récupérer les demandes paginées
            $withdrawalRequests = $query->paginate(15);
            
            // Calculer les statistiques
            $totalRequests = WithdrawalRequest::count();
            $pendingRequests = WithdrawalRequest::where('status', 'pending')->count();
            $approvedRequests = WithdrawalRequest::where('status', 'approved')->count();
            $rejectedRequests = WithdrawalRequest::where('status', 'rejected')->count();
            $cancelledRequests = WithdrawalRequest::where('status', 'cancelled')->count();
            
            $totalAmount = WithdrawalRequest::sum('amount');
            $pendingAmount = WithdrawalRequest::where('status', 'pending')->sum('amount');
            $approvedAmount = WithdrawalRequest::where('status', 'approved')->sum('amount');
            $rejectedAmount = WithdrawalRequest::where('status', 'rejected')->sum('amount');
            $paidAmount = $approvedAmount;
            
            // Statistiques par méthode de paiement
            $paymentMethodStats = WithdrawalRequest::select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(amount) as total_amount'))
                ->groupBy('payment_method')
                ->get();
            
            // Statistiques par mois (12 derniers mois)
            $monthlyStats = WithdrawalRequest::select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('count(*) as count'),
                    DB::raw('sum(amount) as total_amount')
                )
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('year', 'month')
                ->orderBy('year', 'asc')
                ->orderBy('month', 'asc')
                ->get();
                
            return response()->json([
                'success' => true,
                'withdrawal_requests' => $withdrawalRequests,
                'stats' => [
                    'total_requests' => $totalRequests,
                    'pending_requests' => $pendingRequests,
                    'approved_requests' => $approvedRequests,
                    'rejected_requests' => $rejectedRequests,
                    'cancelled_requests' => $cancelledRequests,
                    'total_amount' => $totalAmount,
                    'pending_amount' => $pendingAmount,
                    'approved_amount' => $approvedAmount,
                    'rejected_amount' => $rejectedAmount,
                    'paid_amount' => $paidAmount,
                    'payment_method_stats' => $paymentMethodStats,
                    'monthly_stats' => $monthlyStats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des demandes de retrait: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des demandes de retrait',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    protected function cleanPhoneNumber($phone)
    {
        // Le traitement de l'indicatif téléphonique est maintenant géré côté frontend
        // Cette fonction ne fait plus que vérifier la validité du numéro
        
        // Supprimer tous les caractères non numériques
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Vérifier que le numéro n'est pas vide
        if (empty($phone)) {
            throw new \InvalidArgumentException("Le numéro de téléphone ne peut pas être vide");
        }
        
        // Retourner le numéro tel quel (déjà formaté par le frontend)
        return $phone;
    }


    /**
     * Créer une nouvelle demande de retrait
     *
     * @param Request $request Les données de la demande
     * @param int $walletId L'ID du portefeuille
     * @return JsonResponse
     */
    public function request(Request $request, $walletId)
    {
        \Log::info('Tentative de retrait - Début', [
            'request' => $request->all(),
            'wallet_id' => $walletId,
            'method' => $request->method(),
            'url' => $request->url(),
            'headers' => $request->header()
        ]);
        try {
            $validator = Validator::make($request->all(), [
                'phone_number' => 'required_if:payment_type,mobile-money',
                'payment_method' => 'required|string',
                'payment_type' => 'required|string|in:mobile-money,credit-card',
                'amount' => 'required|numeric|min:0',
                'currency' => 'required|string',
                'password' => 'required',
                'withdrawal_fee' => 'required|numeric',
                'referral_commission' => 'required|numeric',
                'total_amount' => 'required|numeric',
                'fee_percentage' => 'required|numeric',
                'account_name' => 'required_if:payment_type,credit-card',
                'account_number' => 'required_if:payment_type,credit-card',
            ]);

            \Log::info('Validation terminée', [
                'passes' => !$validator->fails(),
                'errors_count' => count($validator->errors()),
                'errors' => $validator->errors()->toArray()
            ]);

            if ($validator->fails()) {
                \Log::error('Validation error', [
                    'errors' => $validator->errors()->toArray()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Vérifier le format du numéro de téléphone si présent
            if ($request->has('phone_number') && !empty($request->phone_number)) {
                $this->cleanPhoneNumber($request->phone_number);
            }

            // Vérifier l'authentification (mot de passe)
            $user = $request->user();
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect. Veuillez réessayer.'
                ], 422);
            }
            \Log::info('Authentification par mot de passe réussie', [
                'user_id' => $user->id
            ]);

            // Récupérer le portefeuille
            $wallet = Wallet::find($walletId);

            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Portefeuille non trouvé'
                ], 404);
            }
            
            // Recalculer tous les frais côté serveur pour éviter les abus
            $amount = (float)$request->amount; // Montant à retirer
            
            // Récupérer les frais de transaction pour la méthode de paiement
            $transactionFee = TransactionFee::where('payment_method', $request->payment_method)
                ->where('is_active', true)
                ->first();
            
            // Récupérer le pourcentage de frais spécifiques (API)
            $pourcentage_frais_api = $transactionFee ? $transactionFee->withdrawal_fee_percentage : 0;
            
            // Récupérer le pourcentage de frais système depuis les paramètres globaux
            $pourcentage_frais_system = Setting::where('key', 'withdrawal_fee_percentage')->first();
            $pourcentage_frais_system = $pourcentage_frais_system ? (float)$pourcentage_frais_system->withdrawal_fee_percentage : 0; // 0% par défaut si non défini
            
            // Récupérer le pourcentage de commission depuis les paramètres globaux
            $pourcentage_frais_commission = Setting::where('key', 'withdrawal_commission')->first();
            $pourcentage_frais_commission = $pourcentage_frais_commission ? (float)$pourcentage_frais_commission->withdrawal_commission : 0; // 0% par défaut si non défini
            
            // Calculer les frais spécifiques (API)
            $frais_api = $amount * $pourcentage_frais_api / 100;
            
            // Calculer les frais système
            $frais_de_transaction = $amount * $pourcentage_frais_system / 100;
            
            // Calculer les frais de commission pour le parrain si applicable
            $frais_de_commission = 0;
            $firstUserPack = UserPack::where('user_id', $user->id)->first();
            
            if ($firstUserPack) {
                $pack = Pack::find($firstUserPack->pack_id);
                $sponsor = $firstUserPack->sponsor;
                
                if ($sponsor && $pack) {
                    // Vérifier si le pack du parrain est actif
                    $isActivePackSponsor = $sponsor->packs()
                        ->where('pack_id', $pack->id)
                        ->where('status', 'active')
                        ->exists();
                    
                    if ($isActivePackSponsor) {
                        // Calculer la commission en utilisant le pourcentage récupéré des paramètres globaux
                        $frais_de_commission = $amount * $pourcentage_frais_commission / 100;
                    }
                }
            }
            
            // Calculer le montant total des frais
            $total_frais = $frais_de_transaction + $frais_de_commission;
            
            // Calculer le montant total à débiter du portefeuille
            $totalAmount = $amount + $total_frais;
            
            // Vérifier le solde
            if ($wallet->balance < $totalAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas suffisamment d\'argent dans votre portefeuille (' . $wallet->balance . ' ' . $wallet->currency . ' vs ' . $totalAmount . ' ' . $wallet->currency . ')'
                ], 400);
            }

            DB::beginTransaction();

            // Créer la demande de retrait avec les valeurs calculées côté serveur
            $withdrawalRequest = WithdrawalRequest::create([
                'user_id' => auth()->id(),
                'amount' => $totalAmount, // Montant total calculé côté serveur
                'status' => self::STATUS_PENDING,
                'payment_method' => $request->payment_method,
                'payment_details' => [
                    "payment_type" => $request->payment_type,
                    "payment_method" => $request->payment_method,
                    "montant_a_retirer" => $amount,
                    "montant_a_retirer_en_USD" => $amount,
                    "devise" => $request->currency,
                    "pourcentage_frais_system" => $pourcentage_frais_system,
                    "pourcentage_frais_api" => $pourcentage_frais_api,
                    "pourcentage_frais_commission" => $pourcentage_frais_commission,
                    "frais_de_retrait" => $frais_de_transaction,
                    "frais_api" => $frais_api,
                    "frais_de_commission" => $frais_de_commission,
                    "montant_total_a_payer" => $totalAmount,
                    "payment_details" => $request->payment_details,
                    "phoneNumber" => $request->payment_details['phone_number'] ?? null,
                    "taux_de_change" => 0
                ]
            ]);

            $user = $request->user();

            //Géler le montant à retirer du wallet de l'utilisateur
            $wallet->withdrawFunds($totalAmount, "withdrawal", self::STATUS_PENDING, [
                'withdrawal_request_id' => $withdrawalRequest->id,
                'Dévise souhaitée pour le retrait' => $request->currency,
                'Méthode de paiement' => $request->payment_method,
                'Montant à rétirer' => $request->amount,
                'Pourcentage des frais' => $request->fee_percentage,
                'Frais de retrait' => $request->withdrawal_fee,
                'Frais de commission' => $request->referral_commission,
                'Montant total à payer' => $request->total_amount,
                'Détails de paiement' => $request->payment_details,
                'Statut de paiement' => '',
            ]);

            DB::commit();

            // Notifier l'administrateur
            $admins = User::where('is_admin', true)->get();
            
            foreach ($admins as $admin) {
                $admin->notify(new WithdrawalRequestCreated($withdrawalRequest));
            }

            return response()->json([
                'success' => true,
                'message' => 'Demande de retrait créée avec succès',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la création de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère toutes les demandes de retrait pour l'administration
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRequests()
    {
        try {
            // Vérification que l'utilisateur est un administrateur
            $user = auth()->user();
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
                ], 403);
            }
            
            $requests = WithdrawalRequest::with(['user', 'user.wallet'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($request) {
                    return [
                        'id' => $request->id,
                        'user_id' => $request->user_id,
                        'user_name' => $request->user->name,
                        'user' => $request->user,
                        'wallet_balance' => $request->user->wallet->balance,
                        'amount' => $request->amount,
                        'status' => $request->status,
                        'payment_method' => $request->payment_method,
                        'payment_details' => $request->payment_details,
                        'admin_note' => $request->admin_note,
                        'created_at' => $request->created_at,
                        'processed_at' => $request->processed_at,
                    ];
                });

            $walletSystem = WalletSystem::first()->balance;

            return response()->json([
                'success' => true,
                'requests' => $requests,
                'wallet_system_balance' => $walletSystem
            ]);
        } catch (ModelNotFoundException $e) {
            Log::error('Erreur: modèle non trouvé lors de la récupération des demandes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ressource non trouvée',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des demandes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler une demande de retrait par l'utilisateur
     *
     * @param Request $request Les données de la requête
     * @param int $id L'identifiant de la demande de retrait à annuler
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, $id)
    {
        try {
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            $user = auth()->user();
            if ($withdrawal->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas la permission d\'annuler cette demande de retrait'
                ], 403);
            }

            // Utiliser le service pour annuler la demande
            $withdrawalService = app(\App\Services\WithdrawalService::class);
            $result = $withdrawalService->cancelWithdrawal($withdrawal);
            
            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status_code']);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            Log::error('Erreur: modèle non trouvé lors de l\'annulation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ressource non trouvée',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'annulation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer définitivement une demande de retrait
     * 
     * @param int $id L'identifiant de la demande de retrait à supprimer
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete($id)
    {
        try {
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            if (!auth()->user()->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
                ], 403);
            }

            // Utiliser le service pour supprimer la demande
            $withdrawalService = app(\App\Services\WithdrawalService::class);
            $result = $withdrawalService->deleteWithdrawal($withdrawal);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status_code']);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            Log::error('Erreur: modèle non trouvé lors de la suppression de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ressource non trouvée',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approuver une demande de retrait
     *
     * @param Request $request Les données de la requête
     * @param int $id L'identifiant de la demande de retrait
     * @return JsonResponse
     */
    /**
     * Approuve une demande de retrait
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve(Request $request, $id)
    {
        try {
            // Validation des entrées utilisateur
            $validator = Validator::make($request->all(), [
                'admin_note' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Vérification que l'utilisateur est un administrateur
            if (!auth()->user()->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
                ], 403);
            }
            
            // Récupérer la demande de retrait
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            // Utiliser le service pour approuver la demande
            $withdrawalService = app(\App\Services\WithdrawalService::class);
            $result = $withdrawalService->approveWithdrawal(
                $withdrawal,
                $request->admin_note,
                auth()->id()
            );

            if ($result['success'] === true) {
                return response()->json([
                    'success' => $result['success'],
                    'message' => $result['message']
                ], $result['status_code']);
            }else {
                return response()->json([
                    'success' => $result['success'],
                    'message' => $result['message']
                ], $result['status_code']);
            }
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            Log::error('Erreur: modèle non trouvé lors de l\'approbation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ressource non trouvée',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            // Gestion générale des erreurs
            Log::error('Erreur lors de l\'approbation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calcule les différents frais pour une demande de retrait
     *
     * @param WithdrawalRequest $withdrawal La demande de retrait
     * @param TransactionFee|null $transactionFee Les frais de transaction spécifiques
     * @return array Les différents frais calculés
     */
    private function calculateFees($withdrawal, $transactionFee = null)
    {
        $globalFeePercentage = (float) Setting::getValue('withdrawal_fee_percentage', 0);
        $withdrawalAmount = (float) $withdrawal->payment_details['montant_a_retirer'];
        $globalFees = $withdrawalAmount * ($globalFeePercentage / 100);

        $specificFees = 0;
        if ($transactionFee) {
            $specificFees = $transactionFee->calculateWithdrawalFee($withdrawalAmount);
        }
        
        $systemFees = $globalFees - $specificFees;
        
        return [
            'globalFeePercentage' => $globalFeePercentage,
            'globalFees' => $globalFees,
            'specificFees' => $specificFees,
            'systemFees' => $systemFees
        ];
    }

    /**
     * Rejette une demande de retrait
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'admin_note' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Veuillez remplir correctement le formulaire',
                    'errors' => $validator->errors()
                ], 400);
            }

            $user = auth()->user();
            
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas la permission de rejeter une demande de retrait'
                ], 403);
            }
            
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            // Utiliser le service pour rejeter la demande
            $withdrawalService = app(\App\Services\WithdrawalService::class);
            $result = $withdrawalService->rejectWithdrawal(
                $withdrawal,
                $request->admin_note,
                auth()->id()
            );

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status_code']);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            Log::error('Erreur: modèle non trouvé lors du rejet de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ressource non trouvée',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors du rejet de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère le pourcentage de commission de parrainage depuis les paramètres du système
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getReferralCommissionPercentage()
    {
        try {
            // Récupérer le paramètre withdrawal_commission
            $setting = Setting::where('key', 'withdrawal_commission')->first();
            $user = Auth::user();
            
            //Pour un administrateur, il n'y a pas de frais de commission sur retrait
            if ($user->is_admin) {
                return response()->json([
                    'success' => true,
                    'percentage' => (float) 0,
                    'description' => "admin account"
                ]);
            }else {
                if ($setting) {
                    return response()->json([
                        'success' => true,
                        'percentage' => (float) $setting->value,
                        'description' => $setting->description
                    ]);
                } else {
                    // Si le paramètre n'est pas défini, retourner 0%
                    return response()->json([
                        'success' => true,
                        'percentage' => 0,
                        'description' => 'Pourcentage de commission de parrainage (valeur par défaut)'
                    ]);
                }
            }
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            Log::error('Erreur: modèle non trouvé lors de la récupération du pourcentage de commission', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Paramètre de commission non trouvé',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du pourcentage de commission de parrainage', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du pourcentage de commission de parrainage',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}