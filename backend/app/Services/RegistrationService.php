<?php

namespace App\Services;

use App\Models\User;
use App\Models\Pack;
use App\Models\Role;
use App\Models\Page;
use App\Models\UserPack;
use App\Models\ReferralInvitation;
use App\Notifications\VerifyEmailWithCredentials;
use App\Notifications\ReferralInvitationConverted;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RegistrationService
{
    // Constantes pour les statuts
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';

    protected $codeGenerationService;
    protected $walletService;
    protected $commissionService;

    /**
     * Constructeur avec injection de dépendances
     */
    public function __construct(
        CodeGenerationService $codeGenerationService,
        WalletService $walletService,
        CommissionService $commissionService
    ) {
        $this->codeGenerationService = $codeGenerationService;
        $this->walletService = $walletService;
        $this->commissionService = $commissionService;
    }

    /**
     * Enregistre un nouvel utilisateur avec un pack
     *
     * @param array $userData Données de l'utilisateur
     * @param int $packId ID du pack
     * @return User
     */
    public function registerUserWithPack($userData, $packId)
    {
        // Récupérer le pack
        $pack = Pack::findOrFail($packId);
        
        // Préparer les données de paiement
        $paymentData = $this->preparePaymentData($userData);
        
        // Créer l'utilisateur
        $user = $this->createUser($userData, $pack->id);
        
        // Créer le wallet et enregistrer les transactions
        $this->setupWallets($user, $userData, $pack, $paymentData);
        
        // Créer la page utilisateur
        $this->createUserPage($user->id);
        
        // Générer et associer le code de parrainage
        $userPack = $this->setupUserPack($user, $pack, $userData);
        
        // Traiter les commissions
        $this->commissionService->processCommissions($userPack, $userData['duration_months']);
        
        // Mettre à jour le statut de l'invitation si nécessaire
        if (!empty($userData['invitation_code'])) {
            $this->updateInvitationStatus($userData['invitation_code'], $user->id);
        }
        
        // Envoyer l'email de vérification
        $this->sendVerificationEmail($user, $pack->id, $userData, $userPack);
        
        return $user;
    }

    /**
     * Crée un nouvel utilisateur
     *
     * @param array $userData
     * @param int $packId
     * @return User
     */
    private function createUser($userData, $packId)
    {
        $userrole = Role::where('slug', 'user')->first();
        
        $user = User::create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => Hash::make($userData['password']),
            'sexe' => $userData['gender'],
            'address' => $userData['address'],
            'phone' => $userData['phone'],
            'whatsapp' => $userData['whatsapp'] ?? null,
            'pays' => $userData['country'],
            'province' => $userData['province'],
            'ville' => $userData['city'],
            'status' => self::STATUS_ACTIVE,
            'is_admin' => false,
            'role_id' => $userrole->id,
            'acquisition_source' => $userData['acquisition_source'] ?? null,
            'pack_de_publication_id' => $packId,
        ]);

        // Générer un identifiant unique pour l'utilisateur
        $user->account_id = $this->codeGenerationService->generateUniqueAccountId();
        $user->save();
        
        return $user;
    }

    /**
     * Configure les wallets et enregistre les transactions
     *
     * @param User $user
     * @param array $userData
     * @param Pack $pack
     * @param array $paymentData
     */
    private function setupWallets($user, $userData, $pack, $paymentData)
    {
        // Créer le wallet utilisateur
        $userWallet = $this->walletService->createUserWallet($user->id);
        
        // Préparer les métadonnées de transaction
        $metadata = $this->walletService->preparePackPurchaseMetadata(
            $userData, 
            $pack, 
            $paymentData
        );
        
        // Enregistrer la transaction système
        $this->walletService->recordSystemTransaction([
            'amount' => $paymentData['montantusd_sans_frais_api'],
            'type' => WalletService::TYPE_SALES,
            'status' => WalletService::STATUS_COMPLETED,
            'metadata' => $metadata
        ]);
        
        // Enregistrer la transaction utilisateur
        $this->walletService->recordUserTransaction($userWallet, [
            'amount' => $paymentData['amountInUSD'],
            'type' => WalletService::TYPE_PURCHASE,
            'status' => WalletService::STATUS_COMPLETED,
            'metadata' => $metadata
        ]);
    }

    /**
     * Crée une page pour l'utilisateur
     *
     * @param int $userId
     * @return Page
     */
    private function createUserPage($userId)
    {
        return Page::create([
            'user_id' => $userId,
            'nombre_abonnes' => 0,
            'nombre_likes' => 0,
            'photo_de_couverture' => null,
        ]);
    }

    /**
     * Configure le pack utilisateur avec le code de parrainage
     *
     * @param User $user
     * @param Pack $pack
     * @param array $userData
     * @return UserPack
     */
    private function setupUserPack($user, $pack, $userData)
    {
        // Traiter le code de parrainage
        $sponsorCode = $userData['sponsor_code'] ?? null;
        $sponsorPack = null;
        
        if ($sponsorCode) {
            $sponsorPack = UserPack::where('referral_code', $sponsorCode)->first();
        }
        
        // Générer un code de parrainage unique
        $referralData = $this->codeGenerationService->generateUniqueReferralCode($pack->name);
        $referralLink = $this->codeGenerationService->generateReferralLink($referralData['code']);
        
        // Associer le pack à l'utilisateur
        $user->packs()->attach($pack->id, [
            'status' => self::STATUS_ACTIVE,
            'purchase_date' => now(),
            'expiry_date' => now()->addMonths($userData['duration_months']),
            'is_admin_pack' => false,
            'payment_status' => self::STATUS_COMPLETED,
            'referral_prefix' => $referralData['prefix'],
            'referral_pack_name' => $pack->name,
            'referral_letter' => $referralData['letter'],
            'referral_number' => $referralData['number'],
            'referral_code' => $referralData['code'],
            'link_referral' => $referralLink,
            'sponsor_id' => $sponsorPack->user_id ?? null,
        ]);
        
        return UserPack::where('user_id', $user->id)
                      ->where('pack_id', $pack->id)
                      ->where('referral_code', $referralData['code'])
                      ->first();
    }

    /**
     * Envoie l'email de vérification
     *
     * @param User $user
     * @param int $packId
     * @param array $userData
     * @param UserPack $userPack
     */
    private function sendVerificationEmail($user, $packId, $userData, $userPack)
    {
        $user->notify(new VerifyEmailWithCredentials(
            $packId,
            $userData['duration_months'],
            $userData['password'],
            $userPack->referral_code,
            $userPack->link_referral
        ));
    }

    /**
     * Met à jour le statut d'une invitation après l'inscription d'un utilisateur
     * 
     * @param string $invitationCode Code de l'invitation
     * @param int $userId ID de l'utilisateur qui s'est inscrit
     * @return void
     */
    private function updateInvitationStatus($invitationCode, $userId)
    {
        try {
            $invitation = ReferralInvitation::where('invitation_code', $invitationCode)
                ->whereIn('status', ['pending', 'sent', 'opened'])
                ->first();
                
            if ($invitation) {
                $invitation->status = 'registered';
                $invitation->registered_at = Carbon::now();
                $invitation->save();
                
                // Récupérer le propriétaire de l'invitation et l'utilisateur nouvellement inscrit
                $invitation_owner = $invitation->user;
                $new_user = User::find($userId);
                
                // Envoyer une notification au propriétaire de l'invitation
                if ($invitation_owner && $new_user) {
                    $invitation_owner->notify(new ReferralInvitationConverted($invitation, $new_user));
                }
            }
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du statut de l\'invitation: ' . $e->getMessage());
        }
    }

    /**
     * Traite les commissions pour un pack utilisateur
     *
     * @param UserPack $userPack
     * @param int $durationMonths
     * @return void
     */
    private function processCommissions(UserPack $userPack, $durationMonths)
    {
        $this->commissionService->distributeCommissions($userPack, $durationMonths);
    }

    /**
     * Prépare les données de paiement à partir des données utilisateur
     *
     * @param array $userData
     * @return array
     */
    private function preparePaymentData($userData)
    {
        return [
            'payment_method' => $userData['payment_method'],
            'payment_type' => $userData['payment_type'],
            'amount' => $userData['amount'],
            'currency' => $userData['currency'],
            'payment_details' => $userData['payment_details'] ?? [],
            'amountInUSD' => $userData['amountInUSD'] ?? $userData['amount'],
            'fees' => $userData['fees'] ?? 0,
            'api_fees' => $userData['frais_api'] ?? 0,
            'exchange_rate' => $userData['taux_de_change'] ?? 0,
            'frais_de_transaction_in_usd' => $userData['frais_de_transaction_in_usd'] ?? 0,
            'frais_api_in_usd' => $userData['frais_api_in_usd'] ?? 0,
            'montantusd_sans_frais_api' => $userData['montantusd_sans_frais_api'] ?? 0,
            'montantusd_sans_frais' => $userData['montantusd_sans_frais'] ?? 0
        ];
    }
}
