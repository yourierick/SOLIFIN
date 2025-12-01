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
            $paymentStatus = $request->query('payment_status');
            $paymentMethod = $request->query('payment_method');
            $currency = $request->query('currency');
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
            
            if ($paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            }
            
            if ($paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            }
            
            if ($currency) {
                $query->where('currency', $currency);
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
            $paymentStatus = $request->query('payment_status');
            $paymentMethod = $request->query('payment_method');
            $currency = $request->query('currency');
            $initiatedBy = $request->query('initiated_by');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $search = $request->query('search');
            $perPage = $request->query('per_page', 25); // 25 par défaut
            
            // Construire la requête de base
            $query = WithdrawalRequest::with(['user', 'processor'])
                ->orderBy('created_at', 'desc');
            
            // Appliquer les filtres si présents
            if ($status) {
                $query->where('status', $status);
            }
            
            if ($paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            }
            
            if ($paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            }
            
            if ($currency) {
                $query->where('currency', $currency);
            }
            
            if ($initiatedBy) {
                $user = auth()->user();
                if ($initiatedBy === 'self') {
                    $query->where('user_id', $user->id);
                } elseif ($initiatedBy === 'others') {
                    $query->where('user_id', '!=', $user->id);
                }
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
            $withdrawalRequests = $query->paginate($perPage);
            
            // Calculer les statistiques
            // Créer une requête de base pour les statistiques avec le filtre de devise
            $baseStatsQuery = WithdrawalRequest::query();
            
            // Appliquer le filtre de devise s'il est présent
            if ($currency) {
                $baseStatsQuery->where('currency', $currency);
            }
            
            // Utiliser des requêtes fraîches pour chaque statistique
            $totalRequests = $baseStatsQuery->count();
            $pendingRequests = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'pending')
                ->count();
            $approvedRequests = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'approved')
                ->count();
            $rejectedRequests = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'rejected')
                ->count();
            $cancelledRequests = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'cancelled')
                ->count();
            
            $totalAmount = $baseStatsQuery->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'));
            $pendingAmount = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'pending')
                ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'));
            $approvedAmount = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'approved')
                ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'));
            $rejectedAmount = WithdrawalRequest::query()
                ->when($currency, function($query, $currency) {
                    $query->where('currency', $currency);
                })
                ->where('status', 'rejected')
                ->sum(DB::raw('CAST(amount AS DECIMAL(10,2))'));
            $paidAmount = $approvedAmount;
            
            // Statistiques par méthode de paiement
            $paymentMethodStatsQuery = WithdrawalRequest::select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(CAST(amount AS DECIMAL(10,2))) as total_amount'));
            
            // Appliquer le filtre de devise s'il est présent
            if ($currency) {
                $paymentMethodStatsQuery->where('currency', $currency);
            }
            
            $paymentMethodStats = $paymentMethodStatsQuery->groupBy('payment_method')->get();
            
            // Statistiques par mois (12 derniers mois)
            $monthlyStatsQuery = WithdrawalRequest::select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('count(*) as count'),
                    DB::raw('sum(CAST(amount AS DECIMAL(10,2))) as total_amount')
                )
                ->where('created_at', '>=', now()->subMonths(12));
            
            // Appliquer le filtre de devise s'il est présent
            if ($currency) {
                $monthlyStatsQuery->where('currency', $currency);
            }
            
            $monthlyStats = $monthlyStatsQuery->groupBy('year', 'month')
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

            if (!$transactionFee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Méthode de paiement non disponible pour l\'instant'
                ], 404);
            }
        
            
            // Récupérer le pourcentage de frais système depuis les paramètres globaux
            $pourcentage_frais_system = Setting::where('key', 'withdrawal_fee_percentage')->first();
            $pourcentage_frais_system = $pourcentage_frais_system ? (float)$pourcentage_frais_system->value : 0; // 0% par défaut si non défini
            
            // Récupérer le pourcentage de commission depuis les paramètres globaux
            $pourcentage_frais_commission = Setting::where('key', 'withdrawal_commission')->first();
            $pourcentage_frais_commission = $pourcentage_frais_commission ? (float)$pourcentage_frais_commission->value : 0; // 0% par défaut si non défini
            
            // Calculer les frais système
            $frais_de_transaction = $amount * $pourcentage_frais_system / 100;
            
            // Calculer les frais de commission pour le parrain si applicable
            $frais_de_commission = 0;
            $firstUserPack = UserPack::where('user_id', $user->id)->first();
            
            if ($firstUserPack && !$user->is_admin) {
                $pack = Pack::find($firstUserPack->pack_id);
                $sponsor = $firstUserPack->sponsor;
                
                if ($sponsor && $pack) {
                    // Vérifier si le pack du parrain est actif
                    $isActivePackSponsor = $sponsor->packs()
                        ->where('pack_id', $pack->id)
                        ->where('user_packs.status', 'active')
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
            if ($request->currency === "USD") {
                if ($wallet->balance_usd < $totalAmount) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous n\'avez pas suffisamment d\'argent dans votre portefeuille (' . $wallet->balance_usd . ' $ vs ' . $totalAmount . ' $ )'
                    ], 400);
                }
            }else {
                if ($wallet->balance_cdf < $totalAmount) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous n\'avez pas suffisamment d\'argent dans votre portefeuille (' . $wallet->balance_cdf . ' FC vs' . $totalAmount . ' FC )'
                    ], 400);
                }
            }

            DB::beginTransaction();

            // Créer la demande de retrait avec les valeurs calculées côté serveur
            $withdrawalRequest = WithdrawalRequest::create([
                'user_id' => auth()->id(),
                'amount' => $amount, // Montant à rétirer calculé côté serveur
                'currency' => $request->currency,
                'status' => self::STATUS_PENDING,
                'payment_method' => $request->payment_method,
                'payment_details' => [
                    "payment_type" => $request->payment_type,
                    "payment_method" => $request->payment_method,
                    "montant_a_retirer" => $amount,
                    "devise" => $request->currency,
                    "frais_de_retrait" => $frais_de_transaction,
                    "frais_de_commission" => $frais_de_commission,
                    "montant_total_a_debiter" => $totalAmount,
                    "phoneNumber" => $request->phone_number ?? null,
                ]
            ]);

            $user = $request->user();

            //Géler le montant à retirer du wallet de l'utilisateur
            $wallet->withdrawFunds($totalAmount, $request->currency, "withdrawal", self::STATUS_PENDING, [
                'withdrawal_request_id' => $withdrawalRequest->id,
                'Opération' => 'Retrait des fonds',
                'Dévise' => $request->currency,
                'Méthode de paiement' => $request->payment_method,
                'Montant à rétirer' => $amount,
                'Frais de retrait' => $frais_de_transaction,
                'Frais de commission' => $frais_de_commission,
                'Montant total à débiter' => $totalAmount,
                'Détails de paiement' => $request->payment_details,
                'Statut de paiement' => 'en attente',
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
                'la_trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les demandes de retrait en attente pour l'administration avec pagination et filtres
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRequests(Request $request)
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
            
            // Récupérer les paramètres de filtrage
            $paymentMethod = $request->query('payment_method');
            $currency = $request->query('currency');
            $initiatedBy = $request->query('initiated_by');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $search = $request->query('search');
            
            // Construire la requête de base
            $query = WithdrawalRequest::with(['user', 'user.wallet'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc');
            
            // Appliquer les filtres si présents
            if ($paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            }
            
            if ($currency) {
                $query->where('currency', $currency);
            }
            
            if ($initiatedBy) {
                if ($initiatedBy === 'self') {
                    $query->where('user_id', $user->id);
                } elseif ($initiatedBy === 'others') {
                    $query->where('user_id', '!=', $user->id);
                }
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
            
            // Paginer les résultats (25 par page par défaut)
            $perPage = $request->query('per_page', 25);
            $requests = $query->paginate($perPage);
            
            // Transformer les données pour inclure les informations du wallet
            $transformedData = $requests->getCollection()->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user_id' => $request->user_id,
                    'user_name' => $request->user->name,
                    'user' => $request->user,
                    'wallet_balance_usd' => $request->user->wallet->balance_usd,
                    'wallet_balance_cdf' => $request->user->wallet->balance_cdf,
                    'amount' => $request->amount,
                    'status' => $request->status,
                    'payment_status' => $request->payment_status,
                    'payment_method' => $request->payment_method,
                    'payment_details' => $request->payment_details,
                    'admin_note' => $request->admin_note,
                    'created_at' => $request->created_at,
                    'processed_at' => $request->processed_at,
                ];
            });
            
            // Remplacer la collection dans l'objet de pagination tout en préservant la structure
            $requests->setCollection($transformedData);
            
            $walletSystem = WalletSystem::first();
            if (!$walletSystem) {
                $walletSystem = WalletSystem::create([
                    'balance_usd' => 0,
                    'balance_cdf' => 0,
                    'total_in_usd' => 0,
                    'total_in_cdf' => 0,
                    'total_out_usd' => 0,
                    'total_out_cdf' => 0,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $requests,
                'wallet_system_balance_usd' => $walletSystem->balance_usd,
                'wallet_system_balance_cdf' => $walletSystem->balance_cdf,
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
            $result = $withdrawalService->cancelWithdrawal($withdrawal, $user);
            
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