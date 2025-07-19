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
                'balance' => number_format($userWallet->balance, 2) . ' $',
                'total_earned' => number_format($userWallet->total_earned, 2) . ' $',
                'total_withdrawn' => number_format($userWallet->total_withdrawn, 2) . ' $',
            ] : null;

            // Récupérer les transactions du wallet
            $transactions = WalletTransaction::with('wallet')->where('wallet_id', $userWallet->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => number_format($transaction->amount, 2) . ' $',
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
                'transactions' => $transactions,
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
                'balance' => number_format($userWallet->balance, 2) . ' $'
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
                'original_amount' => 'required|numeric',
                'fee_amount' => 'required|numeric',
                'fee_percentage' => 'required|numeric',
                'commission_amount' => 'required|numeric',
                'commission_percentage' => 'required|numeric',
                'total_fee_amount' => 'required|numeric',
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

            if ($userWallet->balance < $request->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant'
                ], 400);
            }

            // Préparer les métadonnées pour l'expéditeur
            $senderMetadata = [
                "Bénéficiaire" => $recipientWallet->user->name,
                "Montant" => number_format($request->original_amount, 2) . " $",
                "Description" => $request->description ?? 'Transfert de fonds',
                "Détails" => "Vous avez transféré " . number_format($request->original_amount, 2) . " $ au compte " . $recipientWallet->user->account_id
            ];

            // Préparer les métadonnées pour le destinataire
            $recipientMetadata = [
                "Expéditeur" => $userWallet->user->name,
                "Montant" => number_format($request->original_amount, 2) . " $",
                "Description" => $request->description ?? 'Transfert de fonds',
                "Détails" => "Vous avez reçu " . number_format($request->original_amount, 2) . " $ du compte " . $userWallet->user->account_id
            ];

            DB::beginTransaction();
            
            // Effectuer les transactions
            $userWallet->withdrawFunds(
                $request->amount, 
                "transfer", 
                self::STATUS_COMPLETED, 
                $senderMetadata
            );
            
            $recipientWallet->addFunds(
                $request->original_amount, 
                "reception", 
                self::STATUS_COMPLETED, 
                $recipientMetadata
            );

            // Gestion des commissions
            $sponsorWallet = null;
            $sponsorName = null;
            
            if ($request->commission_amount > 0) {
                // Gestion du parrain avec vérification de l'existence du pack et du parrain
                $firstUserPack = UserPack::where('user_id', $user->id)->first();
                $sponsor = $firstUserPack ? User::find($firstUserPack->sponsor_id) : null;
                
                if ($sponsor && $firstUserPack) {
                    $pack = Pack::find($firstUserPack->pack_id);
                    $isActivePackSponsor = $sponsor->packs()
                        ->where('pack_id', $pack->id)
                        ->where('status', 'active')
                        ->exists();
                    
                    if ($isActivePackSponsor) {
                        $sponsorWallet = $sponsor->wallet ?? $walletService->createUserWallet($sponsor->id);
                        $sponsorName = $sponsor->name;
                        
                        $sponsorMetadata = [
                            "Source" => $user->name, 
                            "Type" => "commission de transfert",
                            "Montant" => number_format($request->commission_amount, 2) . " $",
                            "Description" => "Vous avez gagné une commission de ". number_format($request->commission_amount, 2) . 
                                            " $ pour le transfert d'un montant de ". number_format($request->original_amount, 2) .
                                            " $ par votre filleul " . $user->name,
                        ];
                        
                        $sponsorWallet->addFunds(
                            $request->commission_amount, 
                            "commission de transfert", 
                            self::STATUS_COMPLETED, 
                            $sponsorMetadata
                        );
                    }
                }
            }

            // Enregistrer la transaction système
            $systemMetadata = [
                "user" => $user->name, 
                "Montant" => number_format($request->original_amount, 2) . " $",
                "Dévise" => "USD",
                "Frais de transaction" => number_format($request->fee_amount, 2) . " $",
                "Frais de commission" => $sponsorWallet ? 
                    "Paiement d'une commission de " . number_format($request->commission_amount, 2) . " $ à " . $sponsorName : 
                    "Aucune commission payée pour cause de non activation du pack ou d'inexistance du parrain",
                "Description" => "Transfert de ". number_format($request->original_amount, 2) . 
                                "$ par le compte " . $user->account_id . " au compte " . $request->recipient_account_id,
            ];
            
            $walletService->recordSystemTransaction([
                'amount' => $request->original_amount,
                'type' => "transfer",
                'status' => self::STATUS_COMPLETED,
                'metadata' => $systemMetadata
            ]);

            DB::commit();

            // Notifications
            $user->notify(new FundsTransferred(
                $request->original_amount,
                $user->name,
                $recipient->name,
                false,
                $request->description ?? 'Transfert de fonds',
                $user->is_admin
            ));
            
            $recipient->notify(new FundsTransferred(
                $request->original_amount,
                $user->name,
                $recipient->name,
                true,
                $request->description ?? 'Transfert de fonds',
                $user->is_admin
            ));
            
            return response()->json([
                'success' => true,
                'message' => 'Transfert effectué avec succès',
                'new_balance' => number_format($userWallet->balance, 2) . ' $'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors du transfert de fonds: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'recipient' => $request->recipient_account_id ?? null,
                'amount' => $request->amount ?? null
            ]);
            
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
                'Taux de change appliqué' => $request->taux_de_change,
                'Description' => 'Achat des virtuels solifin via ' . $request->payment_method
            ];

            // Ajouter les fonds au portefeuille de l'utilisateur
            $userWallet->addFunds(
                $request->montantusd_sans_frais, 
                self::TYPE_VIRTUAL_PURCHASE,
                self::STATUS_COMPLETED,
                array_merge($metadata, [
                    'Opération' => 'Achat des virtuels'
                ])
            );

            // Enregistrer la transaction système
            $walletService->recordSystemTransaction([
                'amount' => $request->montantusd_sans_frais_api,
                'type' => self::TYPE_VIRTUAL_SALE,
                'status' => self::STATUS_COMPLETED,
                'metadata' => array_merge($metadata, [
                    'Opération' => 'Vente des virtuels',
                    'user' => $user->name,
                    'Id Compte' => $user->account_id,
                    'Frais API' => number_format($request->frais_api, 2) . " " . $request->currency
                ])
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Achat de virtuel effectué avec succès',
                'amount' => $request->amount,
                'new_balance' => number_format($userWallet->balance, 2) . ' $'
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