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
    // Récupérer les données du wallet de l'utilisateur connecté
    public function getWalletData()
    {
        try {
            // Récupérer le wallet de l'utilisateur connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
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
                'password' => 'required'
            ]);

            // Vérifier le mot de passe de l'utilisateur
            $user = Auth::user();
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 401);
            }

            $userWallet = $user->wallet;
            $recipient = User::where("account_id", $request->recipient_account_id)->first();
            
            if (!$recipient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte du bénéficiaire non trouvé'
                ], 404);
            }
            
            $recipientWallet = $recipient->wallet;

            if (!$recipientWallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compte du bénéficiaire non trouvé'
                ], 404);
            }

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

            DB::beginTransaction();
            $userWallet->withdrawFunds($request->amount, "transfer", "completed", ["bénéficiaire" => $recipientWallet->user->name, "montant"=>$request->original_amount, "description"=>$request->description, "Vous avez transferé" => $request->original_amount . " $ au compte " . $recipientWallet->user->account_id]);
            $recipientWallet->addFunds($request->original_amount, "reception", "completed", ["créditeur" => $userWallet->user->name, "montant"=>$request->original_amount, "description"=>$request->description, "Vous avez reçu" => $request->original_amount . " $ du compte " . $userWallet->user->account_id]);

            $walletsystem = WalletSystem::first();
            if (!$walletsystem) {
                $walletsystem = WalletSystem::create(['balance' => 0]);
            }
            
            if ($request->commission_amount > 0) {
                // Gestion du parrain avec vérification de l'existence du pack et du parrain
                $firstUserPack = UserPack::where('user_id', $user->id)->first();
                $sponsor = $firstUserPack ? $firstUserPack->sponsor : null;
                $pack = Pack::where('id', $firstUserPack->pack_id)->first();
                $isActivePackSponsor = $sponsor->packs->where('pack_id', $pack->id)->where('status', 'active')->first();
                
                if ($sponsor && $isActivePackSponsor) {
                    $sponsor->wallet->addFunds($request->commission_amount, "commission de transfert", "completed", [
                        "Source" => $user->name, 
                        "Type" => "commission de transfert",
                        "Montant" => $request->commission_amount . " $",
                        "Description" => "vous avez gagné une commission de ". $request->commission_amount . " $ pour le transfert d'un montant de ". $request->original_amount ." $ par votre filleul " . $user->name,
                    ]);
                }
            }

            $walletsystem->transactions()->create([
                'wallet_system_id' => $walletsystem->id,
                'amount' => $request->original_amount,
                'type' => "transfer",
                'status' => "completed",
                'metadata' => [
                    "user" => $user->name, 
                    "Montant" => $request->original_amount . " $",
                    "Dévise" => "USD",
                    "Frais de transaction" => $request->fee_amount . " $",
                    "Frais de commission" => $sponsor && $isActivePackSponsor ? "Paiement d'une commission de " . $request->commission_amount . " $ à " . $sponsor->name : "Aucune commission payée pour cause de non activation du pack ou d'inexistance du parrain",
                    "Déscription" => "Transfert de ". $request->original_amount . "$ par le compte " . $user->account_id . " au compte " . $request->recipient_account_id,
                ]
            ]);

            DB::commit();

            // Notification à l'utilisateur qui a transféré les fonds
            $user->notify(new FundsTransferred(
                $request->original_amount,
                $user->name,
                $recipient->name,
                false,
                $request->description
            ));
            
            // Notification à l'utilisateur qui a reçu les fonds
            $recipient->notify(new FundsTransferred(
                $request->original_amount,
                $user->name,
                $recipient->name,
                true,
                $request->description
            ));
            
            return response()->json([
                'success' => true,
                'message' => 'Transfert effectué avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error($e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du transfert',
                'error' => 'Erreur lors du transfert'
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
        \Log::info('Achat de virtuel via SerdiPay : ' . json_encode($request->all()));
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:1',
                'fees' => 'required|numeric|min:0',
                'total' => 'required|numeric|min:1',
                'payment_method' => 'required|string',
                'phoneNumber' => 'required|string',
                'currency' => 'required|string',
            ]);
            
            $user = Auth::user();
            $userWallet = $user->wallet;
            
            if (!$userWallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Portefeuille utilisateur non trouvé'
                ], 404);
            }

            $transactionFee = TransactionFee::where('payment_method', $validated['payment_method'])
                                                           ->where('is_active', true)->first();

            if (!$transactionFee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette méthode de paiement n\'est pas encore disponible'
                ], 404);
            }

            
            // Recalculer les frais de transaction (pourcentage configuré dans le système)
            $globalFeesPercentage = (float) Setting::getValue('purchase_fee_percentage', 0);
            
            // Calcul des frais globaux basé sur le montant du paiement
            if ($validated['currency'] == 'CDF') {
                $globalFees = ((float)$request->original_amount) * ($globalFeesPercentage / 100);
            } else {
                $globalFees = ((float)$validated['amount']) * ($globalFeesPercentage / 100);
            }

            $specificFees = $transactionFee->calculateTransferFee((float) $request->original_amount ? $request->original_amount : $validated['amount'], $validated['currency']);
            $totalAmount = $request->original_amount ? $request->original_amount : $validated['amount'] + $globalFees; //montant total à payer récalculé.
    
            // Dans un environnement de production, nous ferions ici l'appel à l'API SerdiPay
            // Pour cette implémentation, nous simulons une transaction réussie
            
            ;;// Simuler un ID de transaction
            $transactionId = 'SP-' . time() . '-' . rand(1000, 9999);
            
            $taux_de_change = 0;
            if ($validated['currency'] == 'CDF') {
                $taux_de_change = ExchangeRates::where('currency', $validated['currency'])->where("target_currency", "USD")->first();
                $taux_de_change = $taux_de_change->rate;

                $globalFeesInUsd = $this->convertToUSD($globalFees, $validated['currency']);
                $specificFeesInUsd = $this->convertToUSD($specificFees, $validated['currency']);
                $totalAmountInUsd = $this->convertToUSD($totalAmount, $validated['currency']);
                $montant_net_in_usd = $this->convertToUSD($request->original_amount, $validated['currency']);
            }
            
            DB::beginTransaction();
            // Ajouter les fonds au portefeuille de l'utilisateur
            $userWallet->addFunds($montant_net_in_usd, 'virtual', 'completed', [
                'Méthode de paiement' => $validated['payment_method'],
                'Téléphone' => $validated['phoneNumber'],
                'Id Transaction' => $transactionId,
                'Dévise' => $validated['currency'],
                'Montant net payé sans les frais' => $request->original_amount ? $request->original_amount . " " . $validated['currency'] : $validated['amount'] . " " . $validated['currency'],
                'Frais de transaction' => $request->original_fees ? $request->original_fees . " " . $validated['currency'] : $globalFees . " $",
                'Taux de change appliqué' => $taux_de_change,
                'Déscription' => 'Achat de virtuel via ' . $validated['payment_method']
            ]);
            
            // Enregistrer la transaction dans le wallet system
            $walletsystem = WalletSystem::first();
            if (!$walletsystem) {
                $walletsystem = WalletSystem::create(['balance' => 0]);
            }
            
            $walletsystem->transactions()->create([
                'wallet_system_id' => $walletsystem->id,
                'amount' => $totalAmountInUsd - $specificFeesInUsd,
                'type' => 'virtual_sale',
                'status' => 'completed',
                'metadata' => [
                    "Opération" => "Achat des virtuels",
                    'user' => $user->name,
                    'Id Compte' => $user->account_id,
                    'Méthode de paiement' => $validated['payment_method'],
                    'Téléphone' => $validated['phoneNumber'],
                    'Id de la Transaction' => $transactionId,
                    'Montant net payé sans les frais' => $validated['amount'] . ' ' . $validated['currency'],
                    'Frais de transaction' => $globalFees . ' ' . $validated['currency'],
                    'Frais API' => $specificFees . ' ' . $validated['currency'],
                    'Taux de change appliqué' => $taux_de_change,
                    'Déscription' => 'Achat de virtuel via ' . $validated['payment_method']
                ]
            ]);

            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Achat de virtuel effectué avec succès',
                'transaction_id' => $transactionId,
                'amount' => $validated['amount'],
                'new_balance' => number_format($userWallet->balance, 2) . ' $'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'achat de virtuel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement de votre achat',
                'error' => $e->getMessage()
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