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
    public function getWalletData()
    {
        try {
            // Récupérer le wallet de l'admin connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            if (!$userWallet) {
                $role = Role::where('slug', 'super-admin')->first();
                $user = User::where('role_id', $role->id)->first();
                $userWallet = $user->wallet;
            }
            $adminWallet = $userWallet ? [
                'balance' => number_format($userWallet->balance, 2),
                'total_earned' => number_format($userWallet->total_earned, 2),
                'total_withdrawn' => number_format($userWallet->total_withdrawn, 2),
                'user' => $userWallet->user
            ] : null;

            // Récupérer le wallet system (il n'y en a qu'un seul)
            $systemWallet = WalletSystem::first();
            $systemWalletData = $systemWallet ? [
                'balance' => number_format($systemWallet->balance, 2),
                'total_in' => number_format($systemWallet->total_in, 2),
                'total_out' => number_format($systemWallet->total_out, 2),
            ] : null;

            // Récupérer les transactions du wallet system
            $systemwallettransactions = WalletSystemTransaction::with('walletSystem')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => number_format($transaction->amount, 2),
                        'type' => $transaction->type,
                        'status' => $transaction->status,
                        'metadata' => $transaction->metadata,
                        'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                    ];
                });

            // Récupérer les transactions du wallet
            $adminwallettransactions = WalletTransaction::with('wallet')->where('wallet_id', $userWallet->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => number_format($transaction->amount, 2),
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