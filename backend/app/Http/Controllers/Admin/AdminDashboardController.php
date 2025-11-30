<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pack;
use App\Models\UserPack;
use App\Models\WithdrawalRequest;
use App\Models\Commission;
use App\Models\WalletTransaction;
use App\Models\WalletSystemTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    /**
     * Récupère les données pour les cards du tableau de bord
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCards()
    {
        // Nombre total d'utilisateurs
        $totalUsers = User::where('is_admin', false)->count();
        
        // Nombre total de demandes de retrait en attente
        $totalWithdrawals = WithdrawalRequest::where('status', 'pending')->count();
        
        // Nombre total d'inscrits aujourd'hui
        $todayUsers = User::where('is_admin', false)
            ->whereDate('created_at', Carbon::today())
            ->count();
        
        // Nombre total des commissions échouées
        $failedCommissions = Commission::where('status', 'failed')->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_withdrawals' => $totalWithdrawals,
                'today_users' => $todayUsers,
                'failed_commissions' => $failedCommissions
            ]
        ]);
    }

    /**
     * Récupère les données pour la vue d'ensemble du réseau
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNetworkOverview(Request $request)
    {
        $period = $request->input('period', 'month'); // day, week, month, year
        
        // Gestion des membres
        $totalUsers = User::where('is_admin', false)->count();
        $activeUsers = User::where('is_admin', false)->where('status', 'active')->count();
        $inactiveUsers = User::where('is_admin', false)->where('status', 'inactive')->count();
        $startDate = $this->getStartDateByPeriod($period);
        $newUsers = User::where('is_admin', false)
            ->where('created_at', '>=', $startDate)
            ->count();
            
        // Récupérer les inscriptions par jour de la semaine en cours
        $startOfWeek = now()->startOfWeek(); // Lundi
        $endOfWeek = now()->endOfWeek();     // Dimanche
        
        $usersByDay = User::where('is_admin', false)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->select(DB::raw('DAYOFWEEK(created_at) as day_of_week'), DB::raw('count(*) as count'))
            ->groupBy('day_of_week')
            ->orderBy('day_of_week')
            ->get()
            ->keyBy('day_of_week');
        
        // Préparer les données pour chaque jour (1=Dimanche, 2=Lundi, ..., 7=Samedi dans MySQL)
        $daysOfWeek = [
            2 => 'Lun',
            3 => 'Mar',
            4 => 'Mer',
            5 => 'Jeu',
            6 => 'Ven',
            7 => 'Sam',
            1 => 'Dim',
        ];
        
        $weeklySignups = [];
        foreach ($daysOfWeek as $dayNum => $dayName) {
            $weeklySignups[] = [
                'name' => $dayName,
                'value' => $usersByDay->has($dayNum) ? $usersByDay[$dayNum]->count : 0
            ];
        }
        
        // Récupérer les sources d'acquisition
        $acquisitionSources = User::where('is_admin', false)
            ->whereNotNull('acquisition_source')
            ->select('acquisition_source', DB::raw('count(*) as count'))
            ->groupBy('acquisition_source')
            ->orderBy('count', 'desc')
            ->get()
            ->map(function($item) {
                $sourceLabels = [
                    'referral' => 'Parrain/Marraine',
                    'social_media' => 'Réseaux sociaux',
                    'search_engine' => 'Moteur de recherche',
                    'friend' => 'Ami(e)',
                    'advertisement' => 'Publicité',
                    'event' => 'Événement',
                    'other' => 'Autre'
                ];
                
                return [
                    'source' => $sourceLabels[$item->acquisition_source] ?? $item->acquisition_source,
                    'count' => $item->count
                ];
            });
        
        $memberManagement = [
            'total_members' => $totalUsers,
            'active_members' => $activeUsers,
            'new_members' => $newUsers,
            'active_percentage' => $totalUsers > 0 
                ? round(($activeUsers / $totalUsers) * 100) 
                : 0,
            'acquisition_sources' => $acquisitionSources
        ];
        
        // Statistiques de parrainage (nombre de parrainages réalisés par membre)
        $referralStats = DB::table('user_packs')
            ->select('users.id', 'users.name', 'users.account_id', 'users.picture', DB::raw('COUNT(user_packs.id) as referral_count'))
            ->join('users', 'users.id', '=', 'user_packs.sponsor_id')
            ->groupBy('users.id', 'users.name', 'users.account_id', 'users.picture')
            ->orderBy('referral_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'account_id' => $user->account_id,
                    'profile_photo' => $user->picture ? asset('storage/' . $user->picture) : null,
                    'referral_count' => $user->referral_count
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'active_users' => $activeUsers,
                'inactive_users' => $inactiveUsers,
                'new_users' => $newUsers,
                'period' => $period,
                'top_referrers' => $referralStats,
                'weekly_signups' => $weeklySignups,
                'acquisition_sources' => $acquisitionSources
            ]
        ]);
    }

    /**
     * Récupère les données pour la gestion des membres
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMembersManagement(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $status = $request->input('status', null);
        $search = $request->input('search', null);
        
        $query = User::where('is_admin', false);
        
        // Filtrer par statut si spécifié
        if ($status) {
            $query->where('status', $status);
        }
        
        // Recherche par nom, email ou ID de compte
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('account_id', 'like', "%{$search}%");
            });
        }
        
        $users = $query->with(['packs', 'wallet'])
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Récupère les données pour le système de parrainage et attribution de bonus
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getReferralSystem(Request $request)
    {
        $userId = $request->input('user_id', null);
        
        if ($userId) {
            // Structure hiérarchique pour un utilisateur spécifique
            $user = User::findOrFail($userId);
            $referralStructure = $this->getReferralStructure($user);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'account_id' => $user->account_id
                    ],
                    'referral_structure' => $referralStructure
                ]
            ]);
        }
        
        // Règles de calcul des bonus
        $bonusRates = DB::table('bonus_rates')
            ->select('bonus_rates.*', 'packs.name as pack_name')
            ->join('packs', 'packs.id', '=', 'bonus_rates.pack_id')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'bonus_rates' => $bonusRates
            ]
        ]);
    }

    /**
     * Récupère les données pour les transactions et paiements
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTransactions(Request $request)
    {
        $perPage = $request->input('per_page', 5);
        $type = $request->input('type', null);
        $status = $request->input('status', null);
        
        // Relevé des transactions financières des membres
        $query = WalletSystemTransaction::query();
        
        if ($type) {
            $query->where('type', $type);
        }
        
        if ($status) {
            $query->where('status', $status);
        }
        
        $memberTransactions = $query->with('wallet.user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        // Historique des paiements (demandes de retrait)
        $withdrawalQuery = WithdrawalRequest::query();
        
        if ($status) {
            $withdrawalQuery->where('status', $status);
        }
        
        $withdrawals = $withdrawalQuery->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        // Statistiques sur les commissions et revenus générés
        $commissionStats = Commission::select(
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count'),
                'status'
            )
            ->groupBy('status')
            ->get()
            ->keyBy('status');
        
        return response()->json([
            'success' => true,
            'data' => [
                'member_transactions' => $memberTransactions,
                'withdrawals' => $withdrawals,
                'commission_stats' => $commissionStats
            ]
        ]);
    }

    /**
     * Récupère les données pour les statistiques par pack
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPackStats(Request $request)
    {
        $period = $request->input('period', 'month'); // day, week, month, year
        $startDate = $this->getStartDateByPeriod($period);
        
        // Récupérer tous les packs
        $packs = Pack::all();
        $packStats = [];
        
        foreach ($packs as $pack) {
            // Nombre total d'inscrit par pack pour la période
            $newUsersCount = UserPack::where('pack_id', $pack->id)
                ->where('created_at', '>=', $startDate)->where('is_admin_pack', false)
                ->count();
            
            // Nombre total d'utilisateur par pack (tous)
            $totalUsersCount = UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)->count();
            
            // Points Bonus sur délais attribués par pack
            $bonusPoints = DB::table('user_bonus_points_history')
                ->where('pack_id', $pack->id)
                ->where('created_at', '>=', $startDate)
                ->sum('points');
            
            // Commissions totales gagnées par pack
            $commissions = Commission::where('pack_id', $pack->id)
                ->where('created_at', '>=', $startDate)
                ->where('status', 'completed')
                ->sum('amount');
            
            $packStats[] = [
                'pack_id' => $pack->id,
                'pack_name' => $pack->name,
                'new_users_count' => $newUsersCount,
                'total_users_count' => $totalUsersCount,
                'bonus_points' => $bonusPoints,
                'commissions' => $commissions
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'pack_stats' => $packStats
            ]
        ]);
    }

    /**
     * Récupère toutes les données du tableau de bord en une seule requête
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardData(Request $request)
    {
        $period = $request->input('period', 'month'); // day, week, month, year
        $currency = $request->input('currency', 'USD'); // USD ou CDF pour tout
        $startDate = $this->getStartDateByPeriod($period);
        $previousStartDate = $this->getStartDateByPeriod($period, 2); // Période précédente pour comparaison
        
        // Données des cartes
        $cards = $this->getCards()->original['data'];
        
        // Vue d'ensemble du réseau
        $networkOverview = $this->getNetworkOverview($request)->original['data'];
        
        // Gestion des membres
        $totalMembers = User::where('is_admin', false)->count();
        $activeMembers = User::where('is_admin', false)->where('status', 'active')->count();
        $newMembers = User::where('is_admin', false)
            ->where('created_at', '>=', $startDate)
            ->count();
        
        // Récupérer les sources d'acquisition
        $acquisitionSources = User::where('is_admin', false)
            ->whereNotNull('acquisition_source')
            ->select('acquisition_source', DB::raw('count(*) as count'))
            ->groupBy('acquisition_source')
            ->orderBy('count', 'desc')
            ->get()
            ->map(function($item) {
                $sourceLabels = [
                    'referral' => 'Parrain/Marraine',
                    'social_media' => 'Réseaux sociaux',
                    'search_engine' => 'Moteur de recherche',
                    'friend' => 'Ami(e)',
                    'advertisement' => 'Publicité',
                    'event' => 'Événement',
                    'other' => 'Autre'
                ];
                
                return [
                    'source' => $sourceLabels[$item->acquisition_source] ?? $item->acquisition_source,
                    'count' => $item->count
                ];
            });
        
        $memberManagement = [
            'total_members' => $totalMembers,
            'active_members' => $activeMembers,
            'new_members' => $newMembers,
            'active_percentage' => $totalMembers > 0 
                ? round(($activeMembers / $totalMembers) * 100) 
                : 0,
            'acquisition_sources' => $acquisitionSources
        ];
        
        // Système de parrainage
        $totalReferrals = UserPack::whereNotNull('sponsor_id')->count();
        $newReferrals = UserPack::whereNotNull('sponsor_id')
            ->where('created_at', '>=', $startDate)
            ->count();
        
        // Calculer le taux de conversion (combien de parrainages aboutissent à un achat)
        $conversionRate = 0;
        try {
            if (Schema::hasTable('referral_invitations')) {
                $totalInvitations = DB::table('referral_invitations')->count();
                if ($totalInvitations > 0) {
                    $conversionRate = round(($totalReferrals / $totalInvitations) * 100);
                }
            }
        } catch (\Exception $e) {
            // Si la table n'existe pas ou une autre erreur se produit
            \Log::error('Erreur lors de la récupération des invitations de parrainage: ' . $e->getMessage());
        }
        
        // Récupérer les bonus sur délais attribués
        $bonusPointsAwarded = 0;
        try {
            if (Schema::hasTable('user_bonus_points_history')) {
                $bonusPointsAwarded = DB::table('user_bonus_points_history')
                    ->where('created_at', '>=', $startDate)
                    ->sum('points');
            }
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des points bonus: ' . $e->getMessage());
        }
        
        // Valeur des bonus en devise
        $bonusValue = 0;
        try {
            if (Schema::hasTable('user_bonus_points_history') && Schema::hasTable('bonus_point_values')) {
                $bonusValue = DB::table('user_bonus_points_history')
                    ->join('bonus_point_values', 'user_bonus_points_history.created_at', '>=', 'bonus_point_values.created_at')
                    ->where('user_bonus_points_history.created_at', '>=', $startDate)
                    ->selectRaw('SUM(user_bonus_points_history.points * bonus_point_values.value) as total_value')
                    ->value('total_value') ?? 0;
            }
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération de la valeur des bonus: ' . $e->getMessage());
        }
        
        // Top packs par parrainage
        $topPacksByReferral = DB::table('user_packs')
            ->join('packs', 'user_packs.pack_id', '=', 'packs.id')
            ->whereNotNull('user_packs.sponsor_id')
            ->select('packs.id', 'packs.name', DB::raw('COUNT(*) as referral_count'))
            ->groupBy('packs.id', 'packs.name')
            ->orderBy('referral_count', 'desc')
            ->limit(5)
            ->get();
        
        $referralSystem = [
            'total_referrals' => $totalReferrals,
            'new_referrals' => $newReferrals,
            'period' => $period,
            'conversion_rate' => $conversionRate,
            'bonus_points_awarded' => $bonusPointsAwarded,
            'bonus_value' => $bonusValue,
            'top_packs' => $topPacksByReferral
        ];
        
        // Statistiques par pack
        $packs = Pack::all();
        $packStats = [];
        
        foreach ($packs as $pack) {
            // Calculer les ventes selon la période sélectionnée
            if ($period === 'week') {
                // Ventes de la semaine en cours
                $currentWeekStart = now()->startOfWeek();
                $currentWeekEnd = now();
                $currentSales = UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)
                    ->whereBetween('created_at', [$currentWeekStart, $currentWeekEnd])
                    ->count();
                
                // Ventes de la semaine précédente
                $previousWeekStart = now()->startOfWeek()->subWeek(1);
                $previousWeekEnd = now()->startOfWeek();
                $previousSales = UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)
                    ->whereBetween('created_at', [$previousWeekStart, $previousWeekEnd])
                    ->count();
            } else {
                // Pour day, month, year : utiliser la logique existante basée sur $startDate
                $currentSales = UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)
                    ->where('created_at', '>=', $startDate)
                    ->count();
                
                $previousSales = UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)
                    ->where('created_at', '>=', $previousStartDate)
                    ->where('created_at', '<', $startDate)
                    ->count();
            }
            
            // Calculer le changement en pourcentage
            $salesChange = 0;
            if ($previousSales > 0) {
                $salesChange = round((($currentSales - $previousSales) / $previousSales) * 100, 1);
            } elseif ($currentSales > 0) {
                $salesChange = 100; // Si la période précédente était 0 et cette période > 0
            }
            
            // Revenus générés par ce pack (basés sur les ventes de la période en cours et la devise sélectionnée)
            $packPrice = $currency === 'CDF' && $pack->cdf_price ? $pack->cdf_price : $pack->price;
            $revenue = $currentSales * $packPrice;
            
            // Déterminer la tendance (comparaison période en cours vs période précédente)
            $trend = 'stable';
            if ($currentSales > $previousSales) {
                $trend = 'up';
            } elseif ($currentSales < $previousSales) {
                $trend = 'down';
            }
            
            // Récupérer le nombre total d'utilisateurs pour ce pack
            $totalUsersCount = UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)->count();
            
            // Récupérer les données de ventes hebdomadaires pour les 4 dernières semaines
            $weeklyData = [
                'week1' => UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)
                    ->whereBetween('created_at', [now()->startOfWeek()->subWeek(3), now()->startOfWeek()->subWeek(2)])
                    ->count(), // Semaine -3 (il y a 3 semaines)
                'week2' => UserPack::where('pack_id', $pack->id)->where('is_admin_pack', false)
                    ->whereBetween('created_at', [now()->startOfWeek()->subWeek(2), now()->startOfWeek()->subWeek(1)])
                    ->count(), // Semaine -2
                'week3' => $previousSales, // Semaine -1 (semaine précédente)
                'week4' => $currentSales,  // Semaine 0 (semaine en cours)
            ];
            
            $packStats[] = [
                'id' => $pack->id,
                'name' => $pack->name,
                'sales' => $currentSales,
                'sales_change' => $salesChange,
                'revenue' => $revenue,
                'currency' => $currency,
                'trend' => $trend,
                'total_users_count' => $totalUsersCount,
                'weekly_sales' => $weeklyData
            ];
        }
        
        // Récupérer les dernières transactions avec filtre de devise
        $latestTransactionsQuery = WalletSystemTransaction::orderBy('created_at', 'desc');
        
        // Appliquer le filtre de devise
        $latestTransactionsQuery->where('currency', $currency);
        
        $latestTransactions = $latestTransactionsQuery->limit(10)->get();
        
        // Récupérer les dernières demandes de retrait avec filtre de devise
        $latestWithdrawalsQuery = WithdrawalRequest::with('user')->orderBy('created_at', 'desc');
        
        // Appliquer le filtre de devise
        $latestWithdrawalsQuery->where('currency', $currency);
        
        $latestWithdrawals = $latestWithdrawalsQuery->limit(5)->get();
            
        
        return response()->json([
            'success' => true,
            'data' => [
                'cards' => $cards,
                'network_overview' => $networkOverview,
                'member_management' => $memberManagement,
                'referral_system' => $referralSystem,
                'pack_stats' => $packStats,
                'latest_transactions' => $latestTransactions,
                'latest_withdrawals' => $latestWithdrawals
            ]
        ]);
    }

    /**
     * Récupère la structure de parrainage pour un utilisateur donné
     * 
     * @param User $user
     * @param int $maxDepth
     * @return array
     */
    private function getReferralStructure(User $user, $maxDepth = 3, $currentDepth = 0)
    {
        if ($currentDepth >= $maxDepth) {
            return [];
        }
        
        $referrals = UserPack::where('sponsor_id', $user->id)
            ->with('user', 'pack')
            ->get()
            ->groupBy('user_id');
        
        $result = [];
        
        foreach ($referrals as $userId => $userPacks) {
            $referralUser = $userPacks->first()->user;
            
            $userNode = [
                'id' => $referralUser->id,
                'name' => $referralUser->name,
                'account_id' => $referralUser->account_id,
                'packs' => $userPacks->map(function($up) {
                    return [
                        'id' => $up->pack_id,
                        'name' => $up->pack->name,
                        'purchase_date' => $up->created_at->format('Y-m-d')
                    ];
                }),
                'children' => $this->getReferralStructure($referralUser, $maxDepth, $currentDepth + 1)
            ];
            
            $result[] = $userNode;
        }
        
        return $result;
    }

    /**
     * Détermine la date de début en fonction de la période sélectionnée
     * 
     * @param string $period
     * @param int $multiplier Multiplicateur pour obtenir des périodes antérieures (1 = période actuelle, 2 = période précédente, etc.)
     * @return \Carbon\Carbon
     */
    private function getStartDateByPeriod($period, $multiplier = 1)
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'day':
                return $now->copy()->subDays($multiplier - 1)->startOfDay();
            case 'week':
                return $now->copy()->subWeeks($multiplier - 1)->startOfWeek();
            case 'year':
                return $now->copy()->subYears($multiplier - 1)->startOfYear();
            case 'month':
            default:
                return $now->copy()->subMonths($multiplier - 1)->startOfMonth();
        }
    }
}
