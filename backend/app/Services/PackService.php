<?php

namespace App\Services;

use App\Models\Pack;
use App\Models\User;
use App\Models\UserPack;
use App\Services\RegistrationService;
use App\Models\WalletSystem;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PackService
{
    protected $codeGenerationService;
    protected $walletService;
    protected $commissionService;

    public function __construct()
    {
        $this->codeGenerationService = new CodeGenerationService();
        $this->walletService = new WalletService();
        $this->commissionService = new CommissionService();
    }

    /**
     * Renouvelle un pack existant pour un utilisateur
     *
     * @param User $user
     * @param UserPack $userPack
     * @param Pack $pack
     * @param array $paymentData
     * @param int $durationMonths
     * @return UserPack
     */
    public function renewPack(User $user, UserPack $userPack, Pack $pack, array $paymentData, int $durationMonths)
    {
        // Traiter le paiement selon la méthode
        if ($paymentData['payment_method'] === 'solifin-wallet') {
            $this->processWalletPayment($user, $pack, $paymentData, 'renewal');
        } else {
            $this->recordExternalPayment($user, $pack, $paymentData, 'renewal');
        }

        // Mettre à jour la date d'expiration du pack
        $userPack->expiry_date = Carbon::now()->addMonths($durationMonths);
        $userPack->status = 'active';
        $userPack->save();

        // Enregistrer la transaction système à partir d'ici seulement si c'est un paiement par wallet
        if ($paymentData['payment_method'] === 'solifin-wallet') {
            $this->recordSystemTransaction($user, $pack, $paymentData, 'purchase');
        }

        // Distribuer les commissions
        $this->commissionService->distributeCommissions($userPack, $paymentData['currency'], $paymentData['amount'], $durationMonths);

        return $userPack->fresh(['pack', 'sponsor']);
    }

    /**
     * Achète un nouveau pack pour un utilisateur
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param int $durationMonths
     * @param string|null $referralCode
     * @return UserPack
     */
    public function purchaseNewPack(User $user, Pack $pack, array $paymentData, int $durationMonths, ?string $referralCode = null)
    {
        // Trouver le parrain si un code de parrainage est fourni
        $sponsorId = null;
        if ($referralCode) {
            $sponsorPack = UserPack::where('referral_code', $referralCode)->first();
            $sponsorId = $sponsorPack->user_id ?? null;
        }

        // Générer un code de parrainage unique
        $referralData = $this->codeGenerationService->generatePackReferralCode($pack->name);

        // Traiter le paiement selon la méthode
        if ($paymentData['payment_method'] === 'solifin-wallet') {
            $this->processWalletPayment($user, $pack, $paymentData, 'purchase');
        } else {
            $this->recordExternalPayment($user, $pack, $paymentData, 'purchase');
        }

        // Enregistrer la transaction système à partir d'ici seulement si c'est un paiement par wallet
        if ($paymentData['payment_method'] === 'solifin-wallet') {
            $this->recordSystemTransaction($user, $pack, $paymentData, 'purchase');
        }

        // Créer l'association utilisateur-pack
        $userPack = $this->createUserPack($user, $pack, $durationMonths, $referralData, $sponsorId);

        //Si l'utilisateur avait un compte en essai, l'activer maintenant
        if ($user->status === RegistrationService::STATUS_TRIAL) {
            $user->status = RegistrationService::STATUS_ACTIVE;
            $user->save();
        }

        // Distribuer les commissions
        $this->commissionService->distributeCommissions($userPack, $paymentData['currency'], $paymentData['amount'], $durationMonths);

        return $userPack;
    }

    /**
     * Traite un paiement via le wallet Solifin
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param string $operationType
     * @return void
     */
    private function processWalletPayment(User $user, Pack $pack, array $paymentData, string $operationType)
    {
        $userWallet = $user->wallet;
        
        $description = $operationType === 'purchase' 
            ? "Vous avez acheté le pack " . $pack->name . " via " . $paymentData['payment_method']
            : "Vous avez renouvelé votre pack " . $pack->name . " via " . $paymentData['payment_method'];

        $metadata = [
            "Opération" => $operationType === 'purchase' ? "Achat d'un nouveau pack" : "Renouvellement de pack",
            "Pack_ID" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé" => $paymentData['amount'] . $paymentData['currency'],
            "Frais de transaction" => $paymentData['fees'] . $paymentData['currency'],
            "Description" => $description
        ];

        $userWallet->withdrawFunds($paymentData['amount'], $paymentData['currency'], "purchase", "completed", $metadata);
    }

    /**
     * Enregistre un paiement externe (non-wallet)
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param string $operationType
     * @return void
     */
    private function recordExternalPayment(User $user, Pack $pack, array $paymentData, string $operationType)
    {
        $description = $operationType === 'purchase' 
            ? "Vous avez acheté le pack " . $pack->name . " via " . $paymentData['payment_method']
            : "Vous avez renouvelé votre pack " . $pack->name . " via " . $paymentData['payment_method'];

        $metadata = [
            "Opération" => $operationType === 'purchase' ? "Achat d'un nouveau pack" : "Renouvellement de pack",
            "Nom du pack" => $pack->name,
            "Durée de souscription" => $paymentData['duration_months'] . " mois",
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé" => $paymentData['amount'] . " " . $paymentData['currency'],
            "Frais de transaction" => $paymentData['fees'] . " " . $paymentData['currency'],
            "Description" => $description
        ];

        $user->wallet->transactions()->create([
            "wallet_id" => $user->wallet->id,
            "type" => "purchase",
            "amount" => $paymentData['amount'],
            "currency" => $paymentData['currency'],
            "status" => "completed",
            "metadata" => $metadata
        ]);

        //Traitement pour le wallet System
        $description = $operationType === 'purchase' 
            ? "Achat du pack " . $pack->name . " via " . $paymentData['payment_method']
            : "Renouvellement du pack " . $pack->name . " via " . $paymentData['payment_method'];

        $metadataSystem = [
            "Opération" => $operationType === 'purchase' ? "Achat d'un nouveau pack" : "Rénouvellement de pack",
            "user" => $user->name, 
            "Pack_ID" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'], 
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé" => $paymentData['amount'] . " " . $paymentData['currency'],
            "Frais de transaction" => $paymentData['fees'] . " " . $paymentData['currency'],
            "Description" => $description
        ];

        // Récupérer le wallet système existant ou le créer avec des soldes par défaut
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

        $amount = $paymentData['amount'] + $paymentData['fees'];
        
        $walletSystem->addFunds(
            $amount, 
            $paymentData['currency'], 
            $operationType === "purchase" ? "pack_sale" : "renew_pack_sale",
            "completed", 
            $metadataSystem
        );
    }

    /**
     * Enregistre une transaction dans le wallet système
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param string $operationType
     * @return void
     */
    private function recordSystemTransaction(User $user, Pack $pack, array $paymentData, string $operationType)
    {
        $walletsystem = WalletSystem::first();
        if (!$walletsystem) {
            $walletsystem = WalletSystem::create([
                'balance_usd' => 0,
                'balance_cdf' => 0,
                'total_in_usd' => 0,
                'total_in_cdf' => 0,
                'total_out_usd' => 0,
                'total_out_cdf' => 0,
            ]);
        }

        $description = $operationType === 'purchase' 
            ? "Achat du pack " . $pack->name . " via " . $paymentData['payment_method']
            : "Renouvellement du pack " . $pack->name . " via " . $paymentData['payment_method'];

        $metadata = [
            "Opération" => $operationType === 'purchase' ? "Achat d'un nouveau pack" : "Rénouvellement de pack",
            "user" => $user->name, 
            "Pack_ID" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'], 
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé" => $paymentData['amount'] . " " . $paymentData['currency'],
            "Frais de transaction" => $paymentData['fees'] . " " . $paymentData['currency'],
            "Description" => $description
        ];

        $walletsystem->transactions()->create([
            'wallet_system_id' => $walletsystem->id,
            'mouvment' => 'out',
            'type' => $operationType === "purchase" ? 'pack_sale' : 'renew_pack_sale',
            'amount' => $paymentData['amount'],
            'currency' => $paymentData['currency'],
            'status' => 'completed',
            'metadata' => $metadata
        ]);
    }

    /**
     * Crée une association utilisateur-pack
     *
     * @param User $user
     * @param Pack $pack
     * @param int $durationMonths
     * @param array $referralData
     * @param int|null $sponsorId
     * @return UserPack
     */
    private function createUserPack(User $user, Pack $pack, int $durationMonths, array $referralData, ?int $sponsorId = null)
    {
        $userPack = $user->packs()->attach($pack->id, [
            'status' => 'active',
            'purchase_date' => now(),
            'expiry_date' => now()->addMonths($durationMonths),
            'is_admin_pack' => false,
            'payment_status' => 'completed',
            'referral_prefix' => $referralData['prefix'],
            'referral_pack_name' => $pack->name,
            'referral_letter' => $referralData['letter'],
            'referral_number' => $referralData['number'],
            'referral_code' => $referralData['code'],
            'link_referral' => $referralData['link'],
            'sponsor_id' => $sponsorId,
        ]);

        return UserPack::where('user_id', $user->id)
                      ->where('pack_id', $pack->id)
                      ->where('referral_code', $referralData['code'])
                      ->first();
    }
}
