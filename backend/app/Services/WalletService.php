<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\WalletSystem;

class WalletService
{
    // Constantes pour les statuts
    const STATUS_COMPLETED = 'completed';
    const TYPE_PURCHASE = 'purchase';
    const TYPE_SALES = 'sales';

    /**
     * Crée un wallet pour un utilisateur
     *
     * @param int $userId
     * @return Wallet
     */
    public function createUserWallet($userId)
    {
        return Wallet::create([
            'user_id' => $userId,
            'balance' => 0,
            'total_earned' => 0,
            'total_withdrawn' => 0,
        ]);
    }

    /**
     * Enregistre une transaction dans le wallet système
     *
     * @param array $transactionData
     * @return \App\Models\WalletSystemTransaction
     */
    public function recordSystemTransaction($transactionData)
    {
        $walletSystem = WalletSystem::firstOrCreate([
            'balance' => 0,
            'total_in' => 0,
            'total_out' => 0,
        ]);
        
        return $walletSystem->transactions()->create([
            'wallet_system_id' => $walletSystem->id,
            'amount' => $transactionData['amount'],
            'type' => $transactionData['type'] ?? self::TYPE_SALES,
            'status' => $transactionData['status'] ?? self::STATUS_COMPLETED,
            'metadata' => $transactionData['metadata'] ?? []
        ]);
    }

    /**
     * Enregistre une transaction dans le wallet utilisateur
     *
     * @param Wallet $userWallet
     * @param array $transactionData
     * @return \App\Models\WalletTransaction
     */
    public function recordUserTransaction($userWallet, $transactionData)
    {
        return $userWallet->transactions()->create([
            'wallet_id' => $userWallet->id,
            'amount' => $transactionData['amount'],
            'type' => $transactionData['type'] ?? self::TYPE_PURCHASE,
            'status' => $transactionData['status'] ?? self::STATUS_COMPLETED,
            'metadata' => $transactionData['metadata'] ?? []
        ]);
    }

    /**
     * Prépare les métadonnées de transaction pour un achat de pack
     *
     * @param array $userData
     * @param object $pack
     * @param array $paymentData
     * @return array
     */
    public function preparePackPurchaseMetadata($userData, $pack, $paymentData)
    {
        return [
            "Opération" => "Achat d'un pack d'enregistrement",
            "user" => $userData['name'], 
            "Id du pack" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $userData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'], 
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé" => $paymentData['amount'] . " " . $paymentData['currency'],
            "Frais de transaction" => $paymentData['fees'] . " " . $paymentData['currency'],
            "Frais API" => $paymentData['api_fees'] . " " . $paymentData['currency'],
            "Taux de change appliqué" => $paymentData['exchange_rate'],
            "Description" => "Achat du pack d'enregistrement " . $pack->name . " via " . $paymentData['payment_method']
        ];
    }
}
