<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WalletSystem;
use App\Models\WalletSystemTransaction;
use App\Models\UserBonusPointHistory;
use App\Models\Pack;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * Récupérer toutes les transactions du système de portefeuille
     */
    public function index(Request $request)
    {
        try {
            $query = WalletSystemTransaction::query()
                ->with('walletSystem')
                ->orderBy('created_at', 'desc');

            // Filtrer par type si spécifié
            if ($request->has('type') && !empty($request->type)) {
                $query->where('type', $request->type);
            }

            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Filtrer par statut si spécifié
            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }

            // Filtrer par devise si spécifié
            if ($request->has('currency') && !empty($request->currency)) {
                $query->where('currency', $request->currency);
            }

            // Pagination : par défaut 25, mais configurable via le paramètre per_page
            $perPage = $request->get('per_page', 25);
            $transactions = $query->paginate($perPage);

            // Récupérer le nombre total de transactions avec les mêmes filtres (sans pagination)
            $countQuery = WalletSystemTransaction::query();
            
            // Appliquer les mêmes filtres pour le comptage
            if ($request->has('type') && !empty($request->type)) {
                $countQuery->where('type', $request->type);
            }
            if ($request->has('date_from') && !empty($request->date_from)) {
                $countQuery->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && !empty($request->date_to)) {
                $countQuery->whereDate('created_at', '<=', $request->date_to);
            }
            if ($request->has('status') && !empty($request->status)) {
                $countQuery->where('status', $request->status);
            }
            if ($request->has('currency') && !empty($request->currency)) {
                $countQuery->where('currency', $request->currency);
            }
            
            $totalCount = $countQuery->count();

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'total_count' => $totalCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques des transactions regroupées par type
     */
    public function getStatsByType(Request $request)
    {
        try {
            $query = WalletSystemTransaction::query();

            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Regrouper par type et calculer les totaux (par devise)
            // Debug: Vérifier les devises disponibles dans les transactions
            $availableCurrencies = WalletSystemTransaction::distinct()->pluck('currency');
            \Log::info('Devises disponibles: ' . $availableCurrencies);
            
            // Debug: Compter les transactions par devise (avec différentes variations)
            $countUsd = WalletSystemTransaction::where('currency', 'USD')->count();
            $countCdf = WalletSystemTransaction::where('currency', 'CDF')->count();
            $countCdfLower = WalletSystemTransaction::where('currency', 'cdf')->count();
            $countCdfUpper = WalletSystemTransaction::where('currency', 'Cdf')->count();
            \Log::info('Count USD: ' . $countUsd . ', Count CDF: ' . $countCdf . ', Count cdf: ' . $countCdfLower . ', Count Cdf: ' . $countCdfUpper);
            
            // Debug: Voir quelques transactions CDF récentes
            $recentCdfTransactions = WalletSystemTransaction::where('currency', 'like', '%CD%')->limit(5)->get(['id', 'currency', 'type', 'amount', 'created_at']);
            \Log::info('Transactions CDF récentes: ' . $recentCdfTransactions);

            $statsUsd = $query->where('currency', 'USD')->select('type', 
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('MIN(created_at) as first_transaction'),
                DB::raw('MAX(created_at) as last_transaction')
            )
            ->groupBy('type')
            ->get();

            // Créer une nouvelle requête pour CDF (pour éviter les conflits)
            $queryCdf = WalletSystemTransaction::query();
            
            // Appliquer les mêmes filtres de date
            if ($request->has('date_from') && !empty($request->date_from)) {
                $queryCdf->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && !empty($request->date_to)) {
                $queryCdf->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Essayer avec différentes variations de CDF
            $statsCdf = $queryCdf->whereIn('currency', ['CDF', 'cdf', 'Cdf'])->select('type', 
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('MIN(created_at) as first_transaction'),
                DB::raw('MAX(created_at) as last_transaction')
            )
            ->groupBy('type')
            ->get();

            \Log::info('Stats CDF: ' . $statsCdf);

            // Calculer le total général par devise
            $totalAmountUsd = $query->where('currency', 'USD')->sum('amount');
            $totalAmountCdf = $queryCdf->whereIn('currency', ['CDF', 'cdf', 'Cdf'])->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'stats_usd' => $statsUsd,
                    'stats_cdf' => $statsCdf,
                    'total_amount_usd' => $totalAmountUsd,
                    'total_amount_cdf' => $totalAmountCdf
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques des transactions par période (jour, semaine, mois)
     */
    public function getStatsByPeriod(Request $request)
    {
        try {
            $period = $request->period ?? 'month';
            $type = $request->type ?? null;
            
            $query = WalletSystemTransaction::query();
            
            // Filtrer par type si spécifié
            if (!empty($type)) {
                $query->where('type', $type);
            }

            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Grouper par période (par devise)
            switch ($period) {
                case 'day':
                    // Créer des requêtes séparées pour éviter les conflits
                    $queryUsd = WalletSystemTransaction::query();
                    $queryCdf = WalletSystemTransaction::query();
                    
                    // Appliquer les mêmes filtres de date
                    if ($request->has('date_from') && !empty($request->date_from)) {
                        $queryUsd->whereDate('created_at', '>=', $request->date_from);
                        $queryCdf->whereDate('created_at', '>=', $request->date_from);
                    }
                    if ($request->has('date_to') && !empty($request->date_to)) {
                        $queryUsd->whereDate('created_at', '<=', $request->date_to);
                        $queryCdf->whereDate('created_at', '<=', $request->date_to);
                    }
                    
                    $statsUsd = $queryUsd->where('currency', 'USD')->select(
                        DB::raw('DATE(created_at) as period'),
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(amount) as total_amount')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();

                    $statsCdf = $queryCdf->whereIn('currency', ['CDF', 'cdf', 'Cdf'])->select(
                        DB::raw('DATE(created_at) as period'),
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(amount) as total_amount')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;
                
                case 'week':
                    // Créer des requêtes séparées pour éviter les conflits
                    $queryUsd = WalletSystemTransaction::query();
                    $queryCdf = WalletSystemTransaction::query();
                    
                    // Appliquer les mêmes filtres de date
                    if ($request->has('date_from') && !empty($request->date_from)) {
                        $queryUsd->whereDate('created_at', '>=', $request->date_from);
                        $queryCdf->whereDate('created_at', '>=', $request->date_from);
                    }
                    if ($request->has('date_to') && !empty($request->date_to)) {
                        $queryUsd->whereDate('created_at', '<=', $request->date_to);
                        $queryCdf->whereDate('created_at', '<=', $request->date_to);
                    }
                    
                    $statsUsd = $queryUsd->where('currency', 'USD')->select(
                        DB::raw('YEARWEEK(created_at) as period'),
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(amount) as total_amount'),
                        DB::raw('MIN(DATE(created_at)) as start_date'),
                        DB::raw('MAX(DATE(created_at)) as end_date')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();

                    $statsCdf = $queryCdf->whereIn('currency', ['CDF', 'cdf', 'Cdf'])->select(
                        DB::raw('YEARWEEK(created_at) as period'),
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(amount) as total_amount'),
                        DB::raw('MIN(DATE(created_at)) as start_date'),
                        DB::raw('MAX(DATE(created_at)) as end_date')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;
                
                case 'month':
                default:
                    // Créer des requêtes séparées pour éviter les conflits
                    $queryUsd = WalletSystemTransaction::query();
                    $queryCdf = WalletSystemTransaction::query();
                    
                    // Appliquer les mêmes filtres de date
                    if ($request->has('date_from') && !empty($request->date_from)) {
                        $queryUsd->whereDate('created_at', '>=', $request->date_from);
                        $queryCdf->whereDate('created_at', '>=', $request->date_from);
                    }
                    if ($request->has('date_to') && !empty($request->date_to)) {
                        $queryUsd->whereDate('created_at', '<=', $request->date_to);
                        $queryCdf->whereDate('created_at', '<=', $request->date_to);
                    }
                    
                    $statsUsd = $queryUsd->where('currency', 'USD')->select(
                        DB::raw('DATE_FORMAT(created_at, "%Y-%m") as period'),
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(amount) as total_amount')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();

                    $statsCdf = $queryCdf->whereIn('currency', ['CDF', 'cdf', 'Cdf'])->select(
                        DB::raw('DATE_FORMAT(created_at, "%Y-%m") as period'),
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(amount) as total_amount')
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();
                    break;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'stats_usd' => $statsUsd,
                    'stats_cdf' => $statsCdf,
                    'period_type' => $period
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques par période: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les types de transactions disponibles
     */
    public function getTransactionTypes()
    {
        try {
            $types = WalletSystemTransaction::select('type')
                ->distinct()
                ->pluck('type');

            return response()->json([
                'success' => true,
                'data' => $types
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des types de transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer le solde actuel du système
     */
    public function getSystemBalance()
    {
        try {
            $walletSystem = WalletSystem::first();
            
            if (!$walletSystem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun système de portefeuille trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'balance_usd' => $walletSystem->balance_usd,
                    'balance_cdf' => $walletSystem->balance_cdf,
                    'total_in_usd' => $walletSystem->total_in_usd,
                    'total_in_cdf' => $walletSystem->total_in_cdf,
                    'total_out_usd' => $walletSystem->total_out_usd,
                    'total_out_cdf' => $walletSystem->total_out_cdf,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du solde du système: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer le résumé des finances
     */
    public function getSummary(Request $request)
    {
        try {
            // Période par défaut: dernier mois
            $startDate = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->subMonth();
            $endDate = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();

            // Récupérer le solde actuel
            $walletSystem = WalletSystem::first();
            
            if (!$walletSystem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun système de portefeuille trouvé'
                ], 404);
            }

            // Récupérer les statistiques par type pour la période
            $statsByType = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('type', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('status', 'completed')
                ->groupBy('type')
                ->get();

            // Récupérer le total des entrées et sorties pour la période (par devise)
            $totalInUsd = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('type', ['sales', 'commission de parrainage', 'frais de retrait', 'frais de transfert', 'commission de retrait', 'bonus'])
                ->where('currency', 'USD')
                ->sum('amount');

            $totalInCdf = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('type', ['sales', 'commission de parrainage', 'frais de retrait', 'frais de transfert', 'commission de retrait', 'bonus'])
                ->where('currency', 'CDF')
                ->sum('amount');

            $totalOutUsd = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->where('type', 'withdrawal')->where('status', 'completed')
                ->where('currency', 'USD')
                ->sum('amount');

            $totalOutCdf = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->where('type', 'withdrawal')->where('status', 'completed')
                ->where('currency', 'CDF')
                ->sum('amount');

            // Récupérer les statistiques par type pour la période (par devise)
            $statsByTypeUsd = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('type', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('status', 'completed')
                ->where('currency', 'USD')
                ->groupBy('type')
                ->get();

            $statsByTypeCdf = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('type', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('status', 'completed')
                ->where('currency', 'CDF')
                ->groupBy('type')
                ->get();

            // Récupérer le nombre de transactions par jour pour la période (par devise)
            $transactionsByDayUsd = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('currency', 'USD')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $transactionsByDayCdf = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('currency', 'CDF')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'current_balance_usd' => $walletSystem->balance_usd,
                    'current_balance_cdf' => $walletSystem->balance_cdf,
                    'total_in_usd_all_time' => $walletSystem->total_in_usd,
                    'total_in_cdf_all_time' => $walletSystem->total_in_cdf,
                    'total_out_usd_all_time' => $walletSystem->total_out_usd,
                    'total_out_cdf_all_time' => $walletSystem->total_out_cdf,
                    'period_total_in_usd' => $totalInUsd,
                    'period_total_in_cdf' => $totalInCdf,
                    'period_total_out_usd' => $totalOutUsd,
                    'period_total_out_cdf' => $totalOutCdf,
                    'stats_by_type_usd' => $statsByTypeUsd,
                    'stats_by_type_cdf' => $statsByTypeCdf,
                    'transactions_by_day_usd' => $transactionsByDayUsd,
                    'transactions_by_day_cdf' => $transactionsByDayCdf,
                    'period' => [
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d')
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du résumé des finances: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer l'historique des points bonus
     */
    public function getBonusPointsHistory(Request $request)
    {
        try {
            $query = UserBonusPointHistory::with(['user', 'pack'])
                ->orderBy('created_at', 'desc');

            // Filtrer par utilisateur si spécifié
            if ($request->has('user_id') && !empty($request->user_id)) {
                $query->where('user_id', $request->user_id);
            }

            // Filtrer par pack si spécifié
            if ($request->has('pack_id') && !empty($request->pack_id)) {
                $query->where('pack_id', $request->pack_id);
            }

            // Filtrer par type si spécifié
            if ($request->has('type') && !empty($request->type)) {
                $query->where('type', $request->type);
            }

            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Recherche par terme si spécifié
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = '%' . $request->search . '%';
                $query->where(function($q) use ($searchTerm) {
                    $q->where('description', 'like', $searchTerm)
                      ->orWhere('id', 'like', $searchTerm)
                      ->orWhereHas('user', function($userQuery) use ($searchTerm) {
                          $userQuery->where('name', 'like', $searchTerm)
                                   ->orWhere('email', 'like', $searchTerm);
                      });
                });
            }

            $history = $query->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique des points bonus: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques des points bonus
     */
    public function getBonusPointsStats(Request $request)
    {
        try {
            // Définir la période de filtrage
            $startDate = $request->has('date_from') && !empty($request->date_from) 
                ? Carbon::parse($request->date_from)->startOfDay() 
                : Carbon::now()->subMonths(1)->startOfDay();
                
            $endDate = $request->has('date_to') && !empty($request->date_to) 
                ? Carbon::parse($request->date_to)->endOfDay() 
                : Carbon::now()->endOfDay();
            
            // Construire la requête de base avec les filtres de date
            $baseQuery = UserBonusPointHistory::whereBetween('created_at', [$startDate, $endDate]);
            
            // Filtrer par utilisateur si spécifié
            if ($request->has('user_id') && !empty($request->user_id)) {
                $baseQuery->where('user_id', $request->user_id);
            }
            
            // Filtrer par pack si spécifié
            if ($request->has('pack_id') && !empty($request->pack_id)) {
                $baseQuery->where('pack_id', $request->pack_id);
            }
            
            // Statistiques par type
            $statsByType = (clone $baseQuery)
                ->select('type', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(points) as total_points')
                )
                ->groupBy('type')
                ->get();

            // Statistiques par pack
            $packQuery = (clone $baseQuery)->whereNotNull('pack_id');
            $statsByPack = $packQuery
                ->select('pack_id', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(points) as total_points')
                )
                ->groupBy('pack_id')
                ->get();

            // Récupérer les noms des packs
            $packIds = $statsByPack->pluck('pack_id')->toArray();
            $packs = Pack::whereIn('id', $packIds)->get(['id', 'name']);
            
            // Ajouter les noms des packs aux statistiques
            $statsByPack = $statsByPack->map(function($stat) use ($packs) {
                $pack = $packs->firstWhere('id', $stat->pack_id);
                $stat->pack_name = $pack ? $pack->name : 'Pack inconnu';
                return $stat;
            });

            // Top utilisateurs avec le plus de points
            $topUsersQuery = DB::table('user_bonus_points');
            
            // Filtrer par utilisateur si spécifié
            if ($request->has('user_id') && !empty($request->user_id)) {
                $topUsersQuery->where('user_id', $request->user_id);
            }
            
            // Filtrer par pack si spécifié
            if ($request->has('pack_id') && !empty($request->pack_id)) {
                $userIds = (clone $baseQuery)->where('pack_id', $request->pack_id)->pluck('user_id')->unique();
                if ($userIds->count() > 0) {
                    $topUsersQuery->whereIn('user_id', $userIds);
                }
            }
            
            $topUsers = $topUsersQuery
                ->select('user_id', DB::raw('SUM(points_disponibles) as total_points'))
                ->groupBy('user_id')
                ->orderBy('total_points', 'desc')
                ->limit(10)
                ->get();

            // Récupérer les informations des utilisateurs
            $userIds = $topUsers->pluck('user_id')->toArray();
            $users = User::whereIn('id', $userIds)->get(['id', 'name', 'email']);
            
            // Ajouter les noms des utilisateurs aux statistiques
            $topUsers = $topUsers->map(function($user) use ($users) {
                $userInfo = $users->firstWhere('id', $user->user_id);
                $user->user_name = $userInfo ? $userInfo->name : 'Utilisateur inconnu';
                $user->user_email = $userInfo ? $userInfo->email : '';
                return $user;
            });

            // Total des points attribués et convertis
            $totalPointsGained = (clone $baseQuery)
                ->where('type', 'gain')
                ->sum('points');

            $totalPointsConverted = (clone $baseQuery)
                ->where('type', 'conversion')
                ->sum('points');

            return response()->json([
                'success' => true,
                'data' => [
                    'stats_by_type' => $statsByType,
                    'stats_by_pack' => $statsByPack,
                    'top_users' => $topUsers,
                    'total_points_gained' => $totalPointsGained,
                    'total_points_converted' => $totalPointsConverted,
                    'period' => [
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d')
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques des points bonus: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les types d'historique de points bonus disponibles
     */
    public function getBonusPointsTypes()
    {
        try {
            $types = UserBonusPointHistory::select('type')
                ->distinct()
                ->pluck('type');

            return response()->json([
                'success' => true,
                'data' => $types
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des types de points bonus: ' . $e->getMessage()
            ], 500);
        }
    }
}
