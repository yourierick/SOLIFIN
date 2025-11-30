<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WalletSystem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Pack;
use App\Models\Setting;
use App\Notifications\FundsTransferred;
use Illuminate\Support\Facades\DB;
use App\Models\ExchangeRates;
use App\Models\TransactionFee;


class WalletUserController extends Controller
{
    const TYPE_VIRTUAL_PURCHASE = 'virtual_purchase';
    const STATUS_COMPLETED = 'completed';
    const TYPE_VIRTUAL_SALE = 'virtual_sale';
    // Récupérer les données du wallet de l'utilisateur connecté
    public function getWalletData()
    {
        try {

            $walletservice = new \App\Services\WalletService();
            // Récupérer le wallet de l'utilisateur connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            $userWallet ?? $userWallet = $walletservice->createUserWallet(Auth::id());
            $Wallet = $userWallet ? [
                'balance_usd' => number_format($userWallet->balance_usd, 2) . ' $',
                'total_earned_usd' => number_format($userWallet->total_earned_usd, 2) . ' $',
                'total_withdrawn_usd' => number_format($userWallet->total_withdrawn_usd, 2) . ' $',
                'balance_cdf' => number_format($userWallet->balance_cdf, 2) . ' FC',
                'total_earned_cdf' => number_format($userWallet->total_earned_cdf, 2) . ' FC',
                'total_withdrawn_cdf' => number_format($userWallet->total_withdrawn_cdf, 2) . ' FC',
            ] : null;

            // Récupérer les transactions usd du wallet
            $transactions_usd = WalletTransaction::with('wallet')->where('wallet_id', $userWallet->id)
                ->where('currency', 'usd')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => number_format($transaction->amount, 2) . ' $',
                        'mouvment' => $transaction->mouvment,
                        'type' => $transaction->type,
                        'status' => $transaction->status,
                        'metadata' => $transaction->metadata,
                        'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                    ];
                });

            // Récupérer les transactions cdf du wallet
            $transactions_cdf = WalletTransaction::with('wallet')->where('wallet_id', $userWallet->id)
                ->where('currency', 'cdf')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => number_format($transaction->amount, 2) . ' FC',
                        'mouvment' => $transaction->mouvment,
                        'type' => $transaction->type,
                        'status' => $transaction->status,
                        'metadata' => $transaction->metadata,
                        'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                    ];
                });

            $user = Auth::user();

            return response()->json([
                'success' => true,
                'userWallet' => $userWallet,
                'transactions_usd' => $transactions_usd,
                'transactions_cdf' => $transactions_cdf,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Récupérer le solde du wallet de l'utilisateur connecté
    public function getWalletBalance()
    {
        try {
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            return response()->json([
                'success' => true,
                'balance_usd' => number_format($userWallet->balance_usd, 2) . ' $',
                'balance_cdf' => number_format($userWallet->balance_cdf, 2) . ' FC'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du solde',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transfert de fonds entre wallets
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function funds_transfer(Request $request)
    {
        try {
            $request->validate([
                'recipient_account_id' => 'required',
                'amount' => 'required|numeric|min:0',
                'currency' => 'required|in:USD,CDF',
                'frais_de_transaction' => 'required|numeric',
                'frais_de_commission' => 'required|numeric',
                'password' => 'required',
                'description' => 'nullable|string'
            ]);

            // Vérifier le mot de passe de l'utilisateur
            $user = Auth::user();
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 401);
            }

            // Initialiser le service wallet
            $walletService = new \App\Services\WalletService();
            
            // Récupérer les wallets
            $userWallet = $user->wallet ?? $walletService->createUserWallet($user->id);
            $recipient = User::where("account_id", $request->recipient_account_id)->first();
            
            if (!$recipient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte du bénéficiaire non trouvé'
                ], 404);
            }
            
            $recipientWallet = $recipient->wallet ?? $walletService->createUserWallet($recipient->id);

            // Vérifications
            if ($userWallet->id == $recipientWallet->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas transférer des fonds sur votre propre compte'
                ], 400);
            }

            $currency = $request->currency;
            $montant_total = $request->amount + $request->frais_de_transaction + $request->frais_de_commission;
            if ($currency === "USD") {
                if ($userWallet->balance_usd < $montant_total) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Solde insuffisant'
                    ], 400);
                }
            }else {
                if ($userWallet->balance_cdf < $montant_total) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Solde insuffisant'
                    ], 400);
                }
            }

            // Préparer les métadonnées pour l'expéditeur
            $senderMetadata = [
                "Bénéficiaire" => $recipientWallet->user->name,
                "Opération" => "Transfert des fonds",
                "Montant" => number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Frais de transaction" => number_format($request->frais_de_transaction, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Frais de commission" => number_format($request->frais_de_commission, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Description" => $request->description ?? 'Transfert de fonds',
                "Détails" => "Vous avez transféré " . number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC") . " au compte " . $recipientWallet->user->account_id
            ];

            // Préparer les métadonnées pour le destinataire
            $recipientMetadata = [
                "Expéditeur" => $userWallet->user->name,
                "Opération" => "Réception des fonds",
                "Montant" => number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Description" => $request->description ?? 'Transfert de fonds',
                "Détails" => "Vous avez reçu " . number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC") . " du compte " . $userWallet->user->account_id
            ];

            DB::beginTransaction();

            // Gestion des commissions
            $sponsorWallet = null;
            $sponsorName = null;
            $frais_de_commission = 0;
            if ($request->frais_de_commission > 0) {
                // Gestion du parrain avec vérification de l'existence du pack et du parrain
                $firstUserPack = UserPack::where('user_id', $user->id)->first();
                $sponsor = $firstUserPack ? User::find($firstUserPack->sponsor_id) : null;
                
                if ($sponsor && $firstUserPack) {
                    $pack = Pack::find($firstUserPack->pack_id);
                    $isActivePackSponsor = $sponsor->packs()
                        ->where('pack_id', $pack->id)
                        ->where('user_packs.status', 'active')
                        ->exists();
                    
                    if ($isActivePackSponsor) {
                        $sponsorWallet = $sponsor->wallet ?? $walletService->createUserWallet($sponsor->id);
                        $sponsorName = $sponsor->name;
                        
                        $sponsorMetadata = [
                            "Source" => $user->name, 
                            "Opération" => "commission de transfert",
                            "Montant" => number_format($request->frais_de_commission, 2) . ($currency === 'USD' ? " $" : " FC"),
                            "Description" => "Vous avez gagné une commission de ". number_format($request->frais_de_commission, 2) . 
                                            ($currency === 'USD' ? ' $' : ' FC') . " pour le transfert d'un montant de ". number_format($request->amount, 2) .
                                            ($currency === 'USD' ? ' $' : ' FC') . " par votre filleul " . $user->name,
                        ];
                        
                        $sponsorWallet->addFunds(
                            $request->frais_de_commission,
                            $currency, 
                            "commission de transfert", 
                            self::STATUS_COMPLETED, 
                            $sponsorMetadata
                        );

                        $frais_de_commission = $request->frais_de_commission;
                    }
                }
            }

            //Récalculer le montant total
            $montant_total = $request->amount + $request->frais_de_transaction + $frais_de_commission;

            // Effectuer les transactions
            $userWallet->withdrawFunds(
                $montant_total, 
                $currency,
                "transfer", 
                self::STATUS_COMPLETED, 
                $senderMetadata
            );
            
            $recipientWallet->addFunds(
                $request->amount, 
                $currency,
                "reception", 
                self::STATUS_COMPLETED, 
                $recipientMetadata
            );

            // Enregistrer la transaction système
            $systemMetadata = [
                "User_ID" => $user->id,
                "user" => $user->name, 
                "Montant" => number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Dévise" => $currency,
                "Frais de transaction" => number_format($request->frais_de_transaction, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Frais de commission" => $sponsorWallet ? 
                    "Paiement d'une commission de " . number_format($request->frais_de_commission, 2) . ($currency === 'USD' ? " $" : " FC") . " à " . $sponsorName : 
                    "Aucune commission payée pour cause de non activation du pack ou d'inexistance du parrain",
                "Description" => "Transfert de ". number_format($request->amount, 2) . 
                                ($currency === 'USD' ? " $" : " FC") . " par le compte " . $user->account_id . " au compte " . $request->recipient_account_id,
            ];
            
            $walletService->recordSystemTransaction([
                'amount' => $request->amount,
                'currency' => $request->currency,
                'type' => "transfer",
                'status' => self::STATUS_COMPLETED,
                'metadata' => $systemMetadata
            ]);

            DB::commit();

            // Notifications
            $user->notify(new FundsTransferred(
                $request->amount . ($currency === 'USD' ? " $" : " FC"),
                $user->name,
                $recipient->name,
                false,
                $request->description ?? 'Transfert de fonds',
            ));
            
            $recipient->notify(new FundsTransferred(
                $request->amount . ($currency === 'USD' ? " $" : " FC"),
                $user->name,
                $recipient->name,
                true,
                $request->description ?? 'Transfert de fonds',
                $user->is_admin
            ));
            
            // Récupérer le nouveau solde selon la devise
            $newBalance = $request->currency === 'USD' 
                ? number_format($userWallet->fresh()->balance_usd, 2) . ' $'
                : number_format($userWallet->fresh()->balance_cdf, 2) . ' FC';
            
            return response()->json([
                'success' => true,
                'message' => 'Transfert effectué avec succès',
                'new_balance' => $newBalance
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors du transfert de fonds: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'recipient' => $request->recipient_account_id ?? null,
                'amount' => $request->amount ?? null
            ]);
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du transfert'
            ], 500);
        }
    }

    /**
     * Récupérer les informations d'un utilisateur par son account_id pour le transfert des fonds wallet-wallet
     */
    public function getRecipientInfo($account_id)
    {
        $recipient = \App\Models\User::where('account_id', $account_id)->first();
        if (!$recipient) {
            return response()->json([
                'success' => false,
                'message' => 'Destinataire introuvable'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'user' => [
                'account_id' => $recipient->account_id,
                'name' => $recipient->name,
                'phone' => $recipient->phone,
                'whatsapp' => $recipient->whatsapp,
                'email' => $recipient->email,
                'address' => $recipient->address,
            ]
        ]);
    }

    /**
     * Récupère le pourcentage de frais de transfert depuis les paramètres du système
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSendingFeePercentage()
    {
        $feePercentage = \App\Models\Setting::where('key', 'sending_fee_percentage')->first();
        
        if (!$feePercentage) {
            // Valeur par défaut si le paramètre n'existe pas
            $feePercentage = 0;
        } else {
            $feePercentage = floatval($feePercentage->value);
        }
        
        return response()->json([
            'success' => true,
            'fee_percentage' => $feePercentage
        ]);
    }
    
    /**
     * Récupère le pourcentage de frais d'achat de virtuel depuis les paramètres du système
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPurchaseFeePercentage()
    {
        // Utiliser la fonction calculatePurchaseFee du TransactionFeeApiController
        $transactionFeeController = new \App\Http\Controllers\Api\TransactionFeeApiController();
        $request = new Request(['amount' => 1]); // Montant fictif pour obtenir le pourcentage
        $response = $transactionFeeController->calculatePurchaseFee($request);
        
        // Extraire le pourcentage de la réponse
        $responseData = json_decode($response->getContent(), true);
        $feePercentage = $responseData['percentage'] ?? 0;
        
        return response()->json([
            'success' => true,
            'fee_percentage' => $feePercentage
        ]);
    }
    
    /**
     * Achat de virtuel via SerdiPay
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchaseVirtual(Request $request)
    {
        try {
            $walletService = new \App\Services\WalletService();
            $user = isset($request->user_id) ? User::findOrFail($request->user_id) : Auth::user();
            $userWallet = $user->wallet;

            if (!$userWallet) {
                $userWallet = $walletService->createUserWallet($user->id);
            }

            DB::beginTransaction();

            // Préparer les métadonnées pour la transaction utilisateur
            $metadata = [
                'Méthode de paiement' => $request->payment_method,
                'Téléphone' => $request->phoneNumber,
                'Dévise' => $request->currency,
                'Montant net payé' => number_format($request->amount, 2) . " " . $request->currency,
                'Frais de transaction' => number_format($request->fees, 2) . " " . $request->currency,
                'Description' => 'Achat des virtuels solifin via ' . $request->payment_method
            ];

            // Ajouter les fonds au portefeuille de l'utilisateur
            $userWallet->addFunds(
                $request->amount, 
                $request->currency,
                self::TYPE_VIRTUAL_PURCHASE,
                self::STATUS_COMPLETED,
                array_merge($metadata, [
                    'Opération' => 'Achat des virtuels'
                ])
            );

            $montant_net_avec_frais = $request->amount + $request->fees;

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

            $walletSystem->addFunds(
                $montant_net_avec_frais,
                $request->currency,
                self::TYPE_VIRTUAL_SALE,
                self::STATUS_COMPLETED,
                array_merge($metadata, [
                    'Opération' => 'Vente des virtuels',
                    'User_ID' => $user->id,
                    'user' => $user->name,
                    'Id Compte' => $user->account_id,
                    'Montant_net' => number_format($request->amount, 2) . " " . $request->currency,
                    'Frais de transaction' => number_format($request->fees, 2) . " " . $request->currency,
                ])
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Achat de virtuel effectué avec succès',
                'amount' => $request->amount,
                'new_balance' => $request->currency === 'USD' ? number_format($userWallet->balance_usd, 2) . ' $' : number_format($userWallet->balance_cdf, 2) . ' FC'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'achat de virtuel: ' . $e->getMessage(), [
                'user_id' => $request->user_id ?? Auth::id(),
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement de votre achat'
            ], 500);
        }
    }
} 