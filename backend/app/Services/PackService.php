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

        // Enregistrer la transaction système
        $this->recordSystemTransaction($user, $pack, $paymentData, 'renewal');

        // Mettre à jour la date d'expiration du pack
        $userPack->expiry_date = Carbon::now()->addMonths($durationMonths);
        $userPack->status = 'active';
        $userPack->save();

        // Distribuer les commissions
        $this->commissionService->distributeCommissions($userPack, $durationMonths);

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

        // Enregistrer la transaction système
        $this->recordSystemTransaction($user, $pack, $paymentData, 'purchase');

        // Créer l'association utilisateur-pack
        $userPack = $this->createUserPack($user, $pack, $durationMonths, $referralData, $sponsorId);

        //Si l'utilisateur avait un compte en essai, l'activer maintenant
        if ($user->status === RegistrationService::STATUS_TRIAL) {
            $user->status = RegistrationService::STATUS_ACTIVE;
            $user->save();
        }

        // Distribuer les commissions
        $this->commissionService->distributeCommissions($userPack, $durationMonths);

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
            "Id du pack" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé sans les frais" => $paymentData['montantusd_sans_frais'] . " $",
            "Frais de transaction" => $paymentData['fees'] . " $",
            "Taux de change appliqué" => $paymentData['taux_de_change'],
            "Description" => $description
        ];

        $userWallet->withdrawFunds($paymentData['amount'], "purchase", "completed", $metadata);
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
            "Frais API" => $paymentData['frais_api'] . " " . $paymentData['currency'],
            "Taux de change appliqué" => $paymentData['taux_de_change'],
            "Description" => $description
        ];

        $user->wallet->transactions()->create([
            "wallet_id" => $user->wallet->id,
            "type" => "purchase",
            "amount" => $paymentData['amountInUSD'],
            "status" => "completed",
            "metadata" => $metadata
        ]);
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
            $walletsystem = WalletSystem::create(['balance' => 0]);
        }

        $description = $operationType === 'purchase' 
            ? "Achat du pack " . $pack->name . " via " . $paymentData['payment_method']
            : "Renouvellement du pack " . $pack->name . " via " . $paymentData['payment_method'];

        $metadata = [
            "Opération" => $operationType === 'purchase' ? "Achat d'un nouveau pack" : "Rénouvellement de pack",
            "user" => $user->name, 
            "Id du pack" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'], 
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Dévise" => $paymentData['currency'],
            "Montant net payé" => $paymentData['amount'] . " " . $paymentData['currency'],
            "Frais de transaction" => $paymentData['fees'] . " " . $paymentData['currency'],
            "Frais API" => $paymentData['frais_api'] . " " . $paymentData['currency'],
            "Taux de change appliqué" => $paymentData['taux_de_change'],
            "Description" => $description
        ];

        $walletsystem->transactions()->create([
            'wallet_system_id' => $walletsystem->id,
            'type' => 'sales',
            'amount' => $paymentData['montantusd_sans_frais_api'],
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
