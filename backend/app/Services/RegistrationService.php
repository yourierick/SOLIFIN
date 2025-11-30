<?php

namespace App\Services;

use App\Models\User;
use App\Models\Pack;
use App\Models\Role;
use App\Models\Page;
use App\Models\UserPack;
use App\Notifications\VerifyEmailWithCredentials;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RegistrationService
{
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_TRIAL = 'trial';
    
    protected $codeGenerationService;
    protected $walletService;

    /**
     * Constructeur avec injection de dépendances
     */
    public function __construct(
        CodeGenerationService $codeGenerationService,
        WalletService $walletService,
    ) {
        $this->codeGenerationService = $codeGenerationService;
        $this->walletService = $walletService;
    }

    /**
     * Enregistre un nouvel utilisateur
     * @param array $userData Données de l'utilisateur
     * @return User
     */
    public function registerUser($userData)
    {
        // Créer l'utilisateur
        $user = $this->createUser($userData);
        
        // Créer le wallet
        $this->setupWallets($user);
        
        // Créer la page utilisateur
        $this->createUserPage($user->id);

        // Envoyer l'email de vérification
        $this->sendVerificationEmail($user, $userData);
        
        return $user;
    }

    /**
     * Crée un nouvel utilisateur
     *
     * @param array $userData
     * @return User
     */
    private function createUser($userData)
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
            'status' => self::STATUS_TRIAL,
            'is_admin' => false,
            'role_id' => $userrole->id,
            'acquisition_source' => $userData['acquisition_source'] ?? null,
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
     */
    private function setupWallets($user)
    {
        // Créer le wallet utilisateur
        $userWallet = $this->walletService->createUserWallet($user->id);
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
     * Envoie l'email de vérification
     *
     * @param User $user
     * @param int $packId
     * @param array $userData
     * @param UserPack $userPack
     */
    private function sendVerificationEmail($user, $userData)
    {
        $user->notify(new VerifyEmailWithCredentials(
            $userData['password'],
        ));
    }
}
