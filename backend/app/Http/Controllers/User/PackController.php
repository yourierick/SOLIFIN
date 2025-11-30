<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\Pack;
use App\Models\User;
use App\Models\Commission;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\TransactionFee;
use App\Models\ExchangeRates;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;

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

    // La méthode processCommissions a été déplacée dans le PackService

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
    public function renewPack(Request $request)
    {
        try {
            $pack = Pack::findOrFail($request->pack_id);
            $user = isset($request->user_id) ? User::findOrFail($request->user_id) : Auth::user();
        
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }
            
            // Vérifier si l'utilisateur a déjà ce pack
            $userPack = UserPack::where('user_id', $user->id)
                ->where('pack_id', $pack->id)
                ->first();
            
            if (!$userPack) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne possédez pas ce pack'
                ], 400);
            }
            
            // Vérifier le solde du wallet si paiement par wallet
            if ($request->payment_method === 'solifin-wallet') {
                $userWallet = $user->wallet;
                
                if ($request->currency === 'USD') {
                    if (!$userWallet || $userWallet->balance_usd < $request->amount) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant dans votre wallet'
                        ], 400);
                    }
                }else {
                    if (!$userWallet || $userWallet->balance_cdf < $request->amount) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant dans votre wallet'
                        ], 400);
                    }
                }
            }
            
            // Préparer les données de paiement
            $paymentData = [
                'payment_method' => $request->payment_method,
                'payment_type' => $request->payment_type,
                'amount' => $request->amount,
                'currency' => $request->currency,
                'fees' => $request->fees,
                'payment_details' => $request->payment_details ?? [],
                'duration_months' => $request->duration_months
            ];
            
            DB::beginTransaction();
            
            // Utiliser le service pour renouveler le pack
            $packService = new \App\Services\PackService();
            $updatedUserPack = $packService->renewPack($user, $userPack, $pack, $paymentData, $request->duration_months);
            
            DB::commit();
            
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
            $user = isset($request->user_id) ? User::findOrFail($request->user_id) : Auth::user();
        
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }
            $pack = Pack::findOrFail($request->pack_id);

            // Vérifier le solde du wallet si paiement par wallet
            if ($request->payment_method === 'solifin-wallet') {
                $userWallet = $user->wallet;
                
                if ($request->currency === "USD") {
                    if (!$userWallet || $userWallet->balance_usd < $request->amount) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant dans votre wallet'
                        ], 400);
                    }
                }else {
                    if (!$userWallet || $userWallet->balance_cdf < $request->amount) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant dans votre wallet'
                        ], 400);
                    }
                }
            }
            
            // Préparer les données de paiement
            $paymentData = [
                'payment_method' => $request->payment_method,
                'payment_type' => $request->payment_type,
                'amount' => $request->amount,
                'currency' => $request->currency,
                'fees' => $request->fees,
                'payment_details' => $request->payment_details ?? [],
                'duration_months' => $request->duration_months
            ];
            
            DB::beginTransaction();
            
            // Utiliser le service pour acheter un nouveau pack
            $packService = new \App\Services\PackService();
            $userPack = $packService->purchaseNewPack(
                $user, 
                $pack, 
                $paymentData, 
                $request->duration_months, 
                $request->referral_code ?? null
            );
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pack acheté avec succès',
                'data' => [
                    'user_pack' => $userPack->load(['pack', 'sponsor'])->toArray()
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack(); // Ajout du rollback en cas d'erreur
            \Log::error('Erreur lors de l\'achat du pack: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement: ' . $e->getMessage()
            ], 500); // Code 500 pour les erreurs serveur
        }
    }

    //récupérer les filleuls d'un pack avec pagination
    public function getPackReferrals(Request $request, Pack $pack)
    {
        try {
            // Récupérer les paramètres de pagination
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);
            $searchTerm = $request->input('search', '');
            $statusFilter = $request->input('status', 'all');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $generationTab = $request->input('generation_tab', 0); // Onglet de génération actif (0-3)
            
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
            $paginationData = [];
            
            // Première génération (niveau 1)
            $level1Referrals = UserPack::with(['user', 'sponsor', 'pack'])
                ->where('sponsor_id', $request->user()->id)
                ->where('pack_id', $pack->id)
                ->get()
                ->map(function ($referral) use ($request, $pack) {
                    $commissions = Commission::where('user_id', $request->user()->id)->where('source_user_id', $referral->user_id)->where('pack_id', $pack->id)->where('status', "completed")->get();
                    $commissionsByCurrency = $commissions->groupBy('currency');
                    
                    $totalCommissionUSD = $commissionsByCurrency->get('USD', collect())->sum('amount');
                    $totalCommissionCDF = $commissionsByCurrency->get('CDF', collect())->sum('amount');
                    $totalCommission = $commissions->sum('amount');
                    
                    return [
                        'id' => $referral->user->id ?? null,
                        'name' => $referral->user->name ?? 'N/A',
                        'purchase_date' => optional($referral->purchase_date)->format('d/m/Y'),
                        'pack_status' => $referral->status ?? 'inactive',
                        'total_commission' => $totalCommission ?? 0,
                        'total_commission_usd' => $totalCommissionUSD ?? 0,
                        'total_commission_cdf' => $totalCommissionCDF ?? 0,
                        'sponsor_id' => $referral->sponsor_id,
                        'referral_code' => $referral->referral_code ?? 'N/A',
                        'pack_name' => $referral->pack->price ? $referral->pack->name : 'N/A',
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
                            $commissions = Commission::where('user_id', $request->user()->id)->where('source_user_id', $referral->user_id)->where('pack_id', $pack->id)->where('status', "completed")->get();
                            $commissionsByCurrency = $commissions->groupBy('currency');
                            
                            $totalCommissionUSD = $commissionsByCurrency->get('USD', collect())->sum('amount');
                            $totalCommissionCDF = $commissionsByCurrency->get('CDF', collect())->sum('amount');
                            $totalCommission = $commissions->sum('amount');
                            
                            return [
                                'id' => $referral->user->id ?? null,
                                'name' => $referral->user->name ?? 'N/A',
                                'purchase_date' => optional($referral->purchase_date)->format('d/m/Y'),
                                'pack_status' => $referral->status ?? 'inactive',
                                'total_commission' => $totalCommission ?? 0,
                                'total_commission_usd' => $totalCommissionUSD ?? 0,
                                'total_commission_cdf' => $totalCommissionCDF ?? 0,
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
            
            // Appliquer les filtres à chaque génération
            for ($i = 0; $i < count($allGenerations); $i++) {
                $filteredGeneration = $allGenerations[$i];
                
                // Filtre par terme de recherche
                if (!empty($searchTerm)) {
                    $filteredGeneration = $filteredGeneration->filter(function ($referral) use ($searchTerm) {
                        return stripos($referral['name'], $searchTerm) !== false || 
                               stripos($referral['pack_name'], $searchTerm) !== false ||
                               stripos($referral['referral_code'], $searchTerm) !== false;
                    });
                }
                
                // Filtre par statut
                if ($statusFilter !== 'all') {
                    $filteredGeneration = $filteredGeneration->filter(function ($referral) use ($statusFilter) {
                        if ($statusFilter === 'active') {
                            return $referral['pack_status'] === 'active';
                        } elseif ($statusFilter === 'inactive') {
                            return $referral['pack_status'] === 'inactive';
                        } elseif ($statusFilter === 'expired') {
                            return $referral['pack_status'] === 'expired';
                        }
                        return true;
                    });
                }
                
                // Filtre par date
                if (!empty($startDate)) {
                    $startDateObj = \Carbon\Carbon::createFromFormat('Y-m-d', $startDate)->startOfDay();
                    $filteredGeneration = $filteredGeneration->filter(function ($referral) use ($startDateObj) {
                        if ($referral['purchase_date'] === 'N/A') return false;
                        $purchaseDate = \Carbon\Carbon::createFromFormat('d/m/Y', $referral['purchase_date'])->startOfDay();
                        return $purchaseDate->greaterThanOrEqualTo($startDateObj);
                    });
                }
                
                if (!empty($endDate)) {
                    $endDateObj = \Carbon\Carbon::createFromFormat('Y-m-d', $endDate)->endOfDay();
                    $filteredGeneration = $filteredGeneration->filter(function ($referral) use ($endDateObj) {
                        if ($referral['purchase_date'] === 'N/A') return false;
                        $purchaseDate = \Carbon\Carbon::createFromFormat('d/m/Y', $referral['purchase_date'])->startOfDay();
                        return $purchaseDate->lessThanOrEqualTo($endDateObj);
                    });
                }
                
                // Calculer les métadonnées de pagination pour chaque génération
                $totalItems = $filteredGeneration->count();
                $lastPage = ceil($totalItems / $perPage);
                $currentPage = min($page, max(1, $lastPage));
                $offset = ($currentPage - 1) * $perPage;
                
                // Paginer les résultats
                $paginatedGeneration = $filteredGeneration->slice($offset, $perPage)->values();
                
                // Stocker les données paginées
                $allGenerations[$i] = $paginatedGeneration;
                
                // Stocker les métadonnées de pagination
                $paginationData[$i] = [
                    'total' => $totalItems,
                    'per_page' => $perPage,
                    'current_page' => $currentPage,
                    'last_page' => $lastPage,
                    'from' => $totalItems > 0 ? $offset + 1 : 0,
                    'to' => min($offset + $perPage, $totalItems)
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $allGenerations,
                'pagination' => $paginationData
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des filleuls: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
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
                
            // Séparer les commissions par devise
            $gen1CommissionsByCurrency = $gen1Commissions->where('status', 'completed')->groupBy('currency');
            $commissionsByGeneration[0] = [
                'usd' => $gen1CommissionsByCurrency->get('USD', collect())->sum('amount'),
                'cdf' => $gen1CommissionsByCurrency->get('CDF', collect())->sum('amount'),
                'total' => $gen1Commissions->where('status', 'completed')->sum('amount')
            ];
            $totalCommission += $commissionsByGeneration[0]['total'];
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
                    
                // Séparer les commissions par devise
                $genCommissionsByCurrency = $genCommissions->where('status', 'completed')->groupBy('currency');
                $commissionsByGeneration[$generation-1] = [
                    'usd' => $genCommissionsByCurrency->get('USD', collect())->sum('amount'),
                    'cdf' => $genCommissionsByCurrency->get('CDF', collect())->sum('amount'),
                    'total' => $genCommissions->where('status', 'completed')->sum('amount')
                ];
                $totalCommission += $commissionsByGeneration[$generation-1]['total'];
                $failedCommission += $genCommissions->where('status', 'failed')->sum('amount');
                
                $currentGenReferrals = $nextGenReferrals;
            }

            // Déterminer la meilleure génération (celle qui a rapporté le plus)
            $generationTotals = array_column($commissionsByGeneration, 'total');
            $bestGeneration = array_search(max($generationTotals), $generationTotals) + 1;

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
                
                $monthlyCommissionsData = Commission::where('user_id', $request->user()->id)
                    ->where('pack_id', $pack->id)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->get()
                    ->groupBy('currency');
                    
                $monthlyCommissions[$month->format('Y-m')] = [
                    'usd' => $monthlyCommissionsData->get('USD', collect())->sum('amount'),
                    'cdf' => $monthlyCommissionsData->get('CDF', collect())->sum('amount'),
                    'total' => $monthlyCommissionsData->sum('amount')
                ];
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
                        'currency' => $commission->currency,
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

            // Calculer les totaux par devise
            $totalUSD = 0;
            $totalCDF = 0;
            foreach ($commissionsByGeneration as $genCommission) {
                $totalUSD += $genCommission['usd'];
                $totalCDF += $genCommission['cdf'];
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
                        'best_generation' => $bestGeneration,
                        'commissions_by_generation' => $commissionsByGeneration,
                        'total_commission_usd' => $totalUSD,
                        'total_commission_cdf' => $totalCDF
                    ],
                    'progression' => [
                        'monthly_signups' => $monthlySignups,
                        'monthly_commissions' => $monthlyCommissions,
                        'top_referral' => $topReferral
                    ],
                    'latest_referrals' => $latestReferrals,
                    'financial_info' => [
                        'total_commission' => $totalCommission,
                        'total_commission_usd' => $totalUSD,
                        'total_commission_cdf' => $totalCDF,
                        'latest_payments' => $latestPayments
                    ],
                    'all_referrals' => $allReferrals,
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