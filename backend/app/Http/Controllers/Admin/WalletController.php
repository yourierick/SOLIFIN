<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\WalletSystemTransaction;
use App\Models\WalletTransaction;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Notifications\FundsTransferred;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function getWalletData(Request $request)
    {
        try {
            // Récupérer les paramètres de pagination et de filtre
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 25);
            $currency = $request->get('currency', 'USD');
            $status = $request->get('status', 'all');
            $type = $request->get('type', 'all');
            $search = $request->get('search', '');
            $startDate = $request->get('start_date', '');
            $endDate = $request->get('end_date', '');
            
            // Valider les paramètres
            $page = max(1, (int) $page);
            $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 25;
            $currency = in_array($currency, ['USD', 'CDF']) ? $currency : 'USD';

            // Récupérer le wallet de l'admin connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            if (!$userWallet) {
                $role = Role::where('slug', 'super-admin')->first();
                $user = User::where('role_id', $role->id)->first();
                $userWallet = $user->wallet;
            }
            $adminWallet = $userWallet ? [
                'id' => $userWallet->id,
                'balance_usd' => $userWallet->balance_usd,
                'balance_cdf' => $userWallet->balance_cdf,
                'total_earned_usd' => $userWallet->total_earned_usd,
                'total_earned_cdf' => $userWallet->total_earned_cdf,
                'total_withdrawn_usd' => $userWallet->total_withdrawn_usd,
                'total_withdrawn_cdf' => $userWallet->total_withdrawn_cdf,
                'user' => $userWallet->user
            ] : null;

            // Récupérer le wallet system (il n'y en a qu'un seul)
            $systemWallet = WalletSystem::first();
            $systemWalletData = $systemWallet ? [
                'balance_usd' => $systemWallet->balance_usd,
                'balance_cdf' => $systemWallet->balance_cdf,
                'total_in_usd' => $systemWallet->total_in_usd,
                'total_out_usd' => $systemWallet->total_out_usd,
                'total_in_cdf' => $systemWallet->total_in_cdf,
                'total_out_cdf' => $systemWallet->total_out_cdf,
            ] : null;

            // Construire les requêtes de base avec filtre de devise
            $systemTransactionsQuery = WalletSystemTransaction::with('walletSystem')
                ->where('currency', $currency);
                
            $adminTransactionsQuery = WalletTransaction::with('wallet')
                ->where('wallet_id', $userWallet->id)
                ->where('currency', $currency);

            // Appliquer les filtres
            if ($status && $status !== 'all') {
                $systemTransactionsQuery->where('status', $status);
                $adminTransactionsQuery->where('status', $status);
            }

            if ($type && $type !== 'all') {
                $systemTransactionsQuery->where('type', $type);
                $adminTransactionsQuery->where('type', $type);
            }

            if ($search) {
                $systemTransactionsQuery->where(function($query) use ($search) {
                    $query->where('id', 'like', '%' . $search . '%')
                          ->orWhere('type', 'like', '%' . $search . '%')
                          ->orWhere('status', 'like', '%' . $search . '%')
                          ->orWhere('amount', 'like', '%' . $search . '%');
                });
                
                $adminTransactionsQuery->where(function($query) use ($search) {
                    $query->where('id', 'like', '%' . $search . '%')
                          ->orWhere('type', 'like', '%' . $search . '%')
                          ->orWhere('status', 'like', '%' . $search . '%')
                          ->orWhere('amount', 'like', '%' . $search . '%');
                });
            }

            if ($startDate) {
                $systemTransactionsQuery->whereDate('created_at', '>=', $startDate);
                $adminTransactionsQuery->whereDate('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $systemTransactionsQuery->whereDate('created_at', '<=', $endDate);
                $adminTransactionsQuery->whereDate('created_at', '<=', $endDate);
            }

            // Calculer les totaux pour la pagination
            $totalSystemTransactions = $systemTransactionsQuery->count();
            $totalAdminTransactions = $adminTransactionsQuery->count();

            // Récupérer les transactions du wallet system avec pagination
            $systemwallettransactions = $systemTransactionsQuery
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page)
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => number_format($transaction->amount, 2),
                        'mouvment' => $transaction->mouvment,
                        'currency' => $transaction->currency,
                        'type' => $transaction->type,
                        'status' => $transaction->status,
                        'metadata' => $transaction->metadata,
                        'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                    ];
                });

            // Récupérer les transactions du wallet admin avec pagination
            $adminwallettransactions = $adminTransactionsQuery
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page)
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'mouvment' => $transaction->mouvment,
                        'currency' => $transaction->currency,
                        'type' => $transaction->type,
                        'status' => $transaction->status,
                        'metadata' => $transaction->metadata,   
                        'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                    ];
                });

            return response()->json([
                'success' => true,
                'adminWallet' => $adminWallet,
                'systemWallet' => $systemWalletData,
                'systemwallettransactions' => $systemwallettransactions,
                'adminwallettransactions' => $adminwallettransactions,
                'totalSystemTransactions' => $totalSystemTransactions,
                'totalAdminTransactions' => $totalAdminTransactions,
                'totalTransactions' => $totalAdminTransactions, // Pour la pagination Material-UI
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'currency' => $currency,
                    'filters' => [
                        'status' => $status,
                        'type' => $type,
                        'search' => $search,
                        'start_date' => $startDate,
                        'end_date' => $endDate
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 