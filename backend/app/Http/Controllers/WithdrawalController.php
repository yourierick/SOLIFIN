<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Models\WalletSystem;
use App\Models\Wallet;
use App\Models\User;
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
    public function __construct()
    {
        // Constructeur simplifié - Service Vonage supprimé
    }
    
    /**
     * Récupère toutes les demandes de retrait (traitées ou non)
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
                'payment_type' => 'required|string|in:mobile-money,bank-transfer,money-transfer,credit-card',
                'amount' => 'required|numeric|min:0',
                'currency' => 'required|string',
                'password' => 'required',
                'withdrawal_fee' => 'required|numeric',
                'referral_commission' => 'required|numeric',
                'total_amount' => 'required|numeric',
                'fee_percentage' => 'required|numeric',
                'account_name' => 'required_if:payment_type,credit-card',
                'account_number' => 'required_if:payment_type,bank-transfer',
                'bank_name' => 'required_if:payment_type,bank-transfer',
                'id_type' => 'required_if:payment_type,money-transfer',
                'id_number' => 'required_if:payment_type,money-transfer',
                'full_name' => 'required_if:payment_type,money-transfer',
                'recipient_country' => 'required_if:payment_type,money-transfer',
                'recipient_city' => 'required_if:payment_type,money-transfer',
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
            
            // Vérifier le solde
            if ($wallet->balance < $request->total_amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas suffisamment d\'argent dans votre portefeuille (' . $wallet->balance . ' ' . $wallet->currency . ' vs ' . $request->amount . ' ' . $wallet->currency . ')'
                ], 400);
            }

            DB::beginTransaction();

            $withdrawalRequest = WithdrawalRequest::create([
                'user_id' => auth()->id(),
                'amount' => $request->total_amount,
                'status' => 'pending',
                'payment_method' => $request->payment_method,
                'payment_details' => [
                    "montant_a_retirer" => $request->amount,
                    "devise" => $request->currency,
                    "fee_percentage" => $request->fee_percentage,
                    "frais_de_retrait" => $request->withdrawal_fee,
                    "frais_de_commission" => $request->referral_commission,
                    "montant_total_a_payer" => $request->total_amount,
                    "payment_details" => $request->payment_details, 
                ]
            ]);

            $user = $request->user();

            //Géler le montant à retirer du wallet de l'utilisateur
            $wallet->withdrawFunds($request->total_amount, "withdrawal", "pending", [
                'withdrawal_request_id' => $withdrawalRequest->id,
                'Dévise souhaitée pour le retrait' => $request->currency,
                'Méthode de paiement' => $request->payment_method,
                'Montant à rétirer' => $request->amount,
                'Pourcentage des frais' => $request->fee_percentage,
                'Frais de retrait' => $request->withdrawal_fee,
                'Frais de commission' => $request->referral_commission,
                'Montant total à payer' => $request->total_amount,
                'Détails de paiement' => $request->payment_details,
                'Statut' => 'En attente',
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
     * @param int $id L'identifiant de la demande de retrait à annuler
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel($id)
    {
        try {
            $withdrawal = WithdrawalRequest::find($id);
            $user = Auth::user();

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            if ($withdrawal->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette demande ne peut pas être annulée car elle n\'est pas en attente'
                ], 400);
            }

            if ($user->id !== $withdrawal->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas la permission d\'annuler cette demande'
                ], 403);
            }

            DB::beginTransaction();

            // Mettre à jour la transaction
            \Log::info($withdrawal->user->wallet);

            $wallet = $user->wallet;
            $wallet->addFunds($withdrawal->amount, "remboursement", "completed", [
                "user" => $withdrawal->user->name,
                "Montant" => $withdrawal->amount,
                "Description" => "remboursement du montant gélé " . $withdrawal->amount . "$ de votre compte suite à l'annulation de votre demande de retrait de " . $withdrawal->payment_details['montant_a_retirer'] . "$",
            ]);

            $transaction = $withdrawal->user->wallet->transactions()
                ->where('type', 'withdrawal')
                ->where('metadata->withdrawal_request_id', $id)
                ->first();

            if ($transaction) {
                $transaction->status = 'cancelled';
                $transaction->save();
            }

            // Annuler la demande
            if ($withdrawal) {
                $withdrawal->status = 'cancelled';
                $withdrawal->refund_at = now();
                $withdrawal->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Demande annulée avec succès'
            ]);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            DB::rollBack();
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
            DB::rollBack();
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
            // Vérification que l'utilisateur est un administrateur
            $user = auth()->user();
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
                ], 403);
            }
            
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            if ($withdrawal->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette demande ne peut pas être supprimée car elle n\'est pas approuvée'
                ], 400);
            }

            DB::beginTransaction();

            // Supprimer la transaction associée si elle existe
            $transaction = $withdrawal->user->wallet->transactions()
                ->where('type', 'withdrawal')
                ->where('metadata->withdrawal_request_id', $id)
                ->first();

            if ($transaction) {
                $transaction->delete();
            }

            // Supprimer la demande
            $withdrawal->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Demande supprimée avec succès'
            ]);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            DB::rollBack();
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
            DB::rollBack();
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
            
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            if ($withdrawal->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette demande ne peut pas être approuvée car elle n\'est pas en attente'
                ], 400);
            }

            // Harmonisation des noms de variables (utilisation du camelCase)
            $feePercentage = $withdrawal->payment_details['fee_percentage'];
            $commissionFees = $withdrawal->payment_details['frais_de_commission'];
            
            $transactionFeeModel = TransactionFee::where('payment_method', $withdrawal->payment_method)
                ->where('is_active', true);
            
            $transactionFee = $transactionFeeModel->first();
            
            // Extraction du calcul des frais dans une méthode séparée pour améliorer la lisibilité
            $fees = $this->calculateFees($withdrawal, $transactionFee);
            $globalFeePercentage = $fees['globalFeePercentage'];
            $globalFees = $fees['globalFees'];
            $specificFees = $fees['specificFees'];
            $systemFees = $fees['systemFees'];

            $taux_de_change = 0;

            if ($withdrawal->payment_details['devise'] === 'CDF') {
                $amount_in_cdf = CurrencyController::convert($withdrawal->payment_details['montant_a_retirer'], 'USD', 'CDF');
                $taux_de_change = ExchangeRates::where('currency', 'USD')->where("target_currency", "CDF")->first();
                $taux_de_change = $taux_de_change->rate;
            }
            
            //Paiement API à implémenter
            
            // Début de la transaction DB
            DB::beginTransaction();

            // Gestion du portefeuille système
            $walletSystem = WalletSystem::first();
            if (!$walletSystem) {
                $walletSystem = WalletSystem::create(
                    [
                        'balance' => 0,
                        'total_in' => 0,
                        'total_out' => 0,
                    ]
                );
            }

            // Gestion du parrain avec vérification de l'existence du pack et du parrain
            $firstUserPack = UserPack::where('user_id', $withdrawal->user->id)->first();
            $pack = Pack::where('id', $firstUserPack->pack_id)->first();
            $sponsor = $firstUserPack ? $firstUserPack->sponsor : null;
            // vérification du pack du parrain s'il existe et s'il est actif ou non
            $isActivePackSponsor = $sponsor->packs->where('pack_id', $pack->id)->where('status', 'active')->first();
            
            if ($sponsor && $isActivePackSponsor) {
                $sponsor->wallet->addFunds($commissionFees, "commission de retrait", "completed", [
                    "Source" => $withdrawal->user->name, 
                    "Type" => "commission de retrait",
                    "Montant" => $commissionFees,
                    "Description" => "vous avez gagné une commission de ". $commissionFees . " $ pour le retrait d'un montant de ". $withdrawal->payment_details['montant_a_retirer'] ." $ par votre filleul " . $withdrawal->user->name, // Correction orthographique
                ]);

                $walletSystem->transactions()->create([
                    "wallet_system_id" => $walletSystem->id,
                    'amount' => $commissionFees,
                    'type' => "commission de retrait",
                    'status' => "completed",
                    'metadata' => [
                        "Type de transaction" => "Commission de retrait",
                        "Source" => $withdrawal->user->name,
                        "Bénéficiaire" => $sponsor->name,
                        "Montant" => $commissionFees,
                        "Description" => "Paiement d'une commission de ". $commissionFees . " $ pour le retrait d'un montant de ". $withdrawal->payment_details['montant_a_retirer'] ." $ au compte " . $sponsor->account_id, // Correction orthographique
                    ]
                ]);
            }

            $walletSystem->transactions()->create([
                'wallet_system_id' => $walletSystem->id,
                'type' => 'withdrawal',
                'amount' => $withdrawal->payment_details['montant_a_retirer'],
                'status' => 'completed',
                'metadata' => [
                    'user' => $withdrawal->user->name,
                    'Montant rétiré' => $withdrawal->payment_details['montant_a_retirer'],
                    'Devise de retrait' => $withdrawal->payment_details['devise'],
                    'Frais total' => $globalFees,
                    'Frais système' => $systemFees,
                    'Frais API' => $specificFees,
                    'Commission de retrait' => $sponsor && $isActivePackSponsor ? $commissionFees . " $" . " payés à " . $sponsor->name : "Aucun sponsor trouvé ou le pack du sponsor n'est pas actif",
                    'Description' => "Retrait de " . $withdrawal->payment_details['montant_a_retirer'] . " par le compte " . $withdrawal->user->account_id,
                    'Taux de change appliqué' => $taux_de_change,
                ]
            ]);

            // Approuver la demande
            $withdrawal->status = 'approved';
            $withdrawal->admin_note = $request->admin_note;
            $withdrawal->processed_by = auth()->id();
            $withdrawal->processed_at = now();
            $withdrawal->paid_at = now();
            $withdrawal->save();

            $transaction = $withdrawal->user->wallet->transactions()
                ->where('type', 'withdrawal')
                ->where('metadata->withdrawal_request_id', $id)
                ->first();

            if ($transaction) {
                $transaction->status = 'completed';
                $transaction->save();
            }

            DB::commit();

            // Notification à l'utilisateur que sa demande a été approuvée
            $withdrawal->user->notify(new WithdrawalRequestProcessed($withdrawal));

            return response()->json([
                'success' => true,
                'message' => 'Demande approuvée avec succès'
            ]);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            DB::rollBack();
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
            DB::rollBack();
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
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demande de retrait non trouvée'
                ], 404);
            }

            if ($withdrawal->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette demande ne peut pas être rejetée car elle n\'est pas en attente'
                ], 400);
            }

            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas la permission de rejeter une demande de retrait'
                ], 403);
            }

            DB::beginTransaction();

            // Rembourser le montant au wallet de l'utilisateur
            $wallet = $withdrawal->user->wallet;
            $wallet->addFunds($withdrawal->amount, "remboursement", "completed", [
                "user" => $withdrawal->user->name,
                "Montant" => $withdrawal->amount,
                "Description" => "remboursement du montant gélé " . $withdrawal->amount . "$ pour le retrait ID: " . $withdrawal->id . " d'un montant de " . $withdrawal->payment_details['montant_a_retirer'] . "$ pour cause de rejet",
            ]);

            // Mettre à jour la transaction originale
            $transaction = $wallet->transactions()
                ->where('type', 'withdrawal')
                ->where('metadata->withdrawal_request_id', $id)
                ->first();

            if ($transaction) {
                $transaction->status = 'rejected';
                $transaction->save();
            }

            // Rejeter la demande
            $withdrawal->status = 'rejected';
            $withdrawal->admin_note = $request->admin_note;
            $withdrawal->processed_by = auth()->id();
            $withdrawal->processed_at = now();
            $withdrawal->refund_at = now();
            $withdrawal->save();

            DB::commit();

            $withdrawal->user->notify(new WithdrawalRequestProcessed($withdrawal));
            return response()->json([
                'success' => true,
                'message' => 'Demande rejetée avec succès'
            ]);
        } catch (ModelNotFoundException $e) {
            // Gestion spécifique des erreurs de modèle non trouvé
            DB::rollBack();
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
            DB::rollBack();
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