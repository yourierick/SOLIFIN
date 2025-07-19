<?php

namespace Tests\Unit\Services;

use App\Models\Pack;
use App\Models\ReferralInvitation;
use App\Models\Role;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Notifications\WelcomeNotification;
use App\Services\CodeGenerationService;
use App\Services\CommissionService;
use App\Services\RegistrationService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Mockery;
use Tests\TestCase;

class RegistrationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $registrationService;
    protected $codeGenerationService;
    protected $walletService;
    protected $commissionService;
    protected $userData;
    protected $pack;
    protected $referralCode;
    protected $sponsor;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer des mocks pour les services dépendants
        $this->codeGenerationService = Mockery::mock(CodeGenerationService::class);
        $this->walletService = Mockery::mock(WalletService::class);
        $this->commissionService = Mockery::mock(CommissionService::class);

        // Créer le service avec les mocks
        $this->registrationService = new RegistrationService(
            $this->codeGenerationService,
            $this->walletService,
            $this->commissionService
        );

        // Créer les données de test
        $this->pack = Pack::factory()->create([
            'name' => 'Free',
            'price' => 0
        ]);

        // Créer un utilisateur parrain
        $this->sponsor = User::factory()->create();
        $this->sponsor->wallet = Wallet::factory()->create([
            'user_id' => $this->sponsor->id,
            'balance' => 500
        ]);

        // Créer un code de parrainage
        $this->referralCode = 'REF1234';
        $this->sponsor->update(['referral_code' => $this->referralCode]);

        // Créer une invitation de parrainage
        ReferralInvitation::create([
            'email' => 'invite@example.com',
            'referral_code' => $this->referralCode,
            'user_id' => $this->sponsor->id,
            'status' => 'pending'
        ]);

        // Données utilisateur pour l'inscription
        $this->userData = [
            'name' => 'John Doe',
            'email' => 'invite@example.com',
            'password' => 'password123',
            'phone' => '243123456789',
            'country' => 'Congo',
            'city' => 'Kinshasa',
            'address' => '123 Main St',
            'referral_code' => $this->referralCode
        ];

        // Créer le rôle utilisateur
        Role::factory()->create(['name' => 'user']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_register_user_with_referral()
    {
        // Configurer les mocks
        $this->codeGenerationService->shouldReceive('generateUniqueAccountId')
            ->once()
            ->andReturn('SOL1234');
        
        $this->codeGenerationService->shouldReceive('generateUniqueReferralCode')
            ->once()
            ->andReturn('REF5678');
        
        $this->codeGenerationService->shouldReceive('buildReferralUrl')
            ->once()
            ->with('REF5678')
            ->andReturn('http://localhost:5173/register?referral_code=REF5678');
        
        $this->walletService->shouldReceive('createWallet')
            ->once()
            ->andReturnUsing(function ($user) {
                return Wallet::factory()->create([
                    'user_id' => $user->id,
                    'balance' => 0
                ]);
            });
        
        $this->commissionService->shouldReceive('distributeCommissions')
            ->once()
            ->andReturn(true);

        // Désactiver les notifications pour le test
        Notification::fake();

        // Exécuter l'inscription
        $user = $this->registrationService->registerUser($this->userData, $this->pack);

        // Assertions sur l'utilisateur créé
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('invite@example.com', $user->email);
        $this->assertEquals('SOL1234', $user->account_id);
        $this->assertEquals('REF5678', $user->referral_code);
        $this->assertTrue(Hash::check('password123', $user->password));
        
        // Vérifier que le wallet a été créé
        $this->assertTrue($user->wallet()->exists());
        
        // Vérifier que le pack a été associé
        $userPack = $user->packs()->first();
        $this->assertInstanceOf(UserPack::class, $userPack);
        $this->assertEquals($this->pack->id, $userPack->pack_id);
        $this->assertEquals('active', $userPack->status);
        
        // Vérifier que le statut de l'invitation a été mis à jour
        $invitation = ReferralInvitation::where('email', 'invite@example.com')->first();
        $this->assertEquals('registered', $invitation->status);
        
        // Vérifier que la notification a été envoyée
        Notification::assertSentTo($user, WelcomeNotification::class);
    }

    /** @test */
    public function it_can_register_user_without_referral()
    {
        // Données utilisateur sans code de parrainage
        $userData = array_merge($this->userData, ['referral_code' => null]);
        
        // Configurer les mocks
        $this->codeGenerationService->shouldReceive('generateUniqueAccountId')
            ->once()
            ->andReturn('SOL1234');
        
        $this->codeGenerationService->shouldReceive('generateUniqueReferralCode')
            ->once()
            ->andReturn('REF5678');
        
        $this->codeGenerationService->shouldReceive('buildReferralUrl')
            ->once()
            ->with('REF5678')
            ->andReturn('http://localhost:5173/register?referral_code=REF5678');
        
        $this->walletService->shouldReceive('createWallet')
            ->once()
            ->andReturnUsing(function ($user) {
                return Wallet::factory()->create([
                    'user_id' => $user->id,
                    'balance' => 0
                ]);
            });

        // Désactiver les notifications pour le test
        Notification::fake();

        // Exécuter l'inscription
        $user = $this->registrationService->registerUser($userData, $this->pack);

        // Assertions sur l'utilisateur créé
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('invite@example.com', $user->email);
        $this->assertEquals('SOL1234', $user->account_id);
        $this->assertEquals('REF5678', $user->referral_code);
        
        // Vérifier que le wallet a été créé
        $this->assertTrue($user->wallet()->exists());
        
        // Vérifier que le pack a été associé
        $userPack = $user->packs()->first();
        $this->assertInstanceOf(UserPack::class, $userPack);
        $this->assertEquals($this->pack->id, $userPack->pack_id);
        $this->assertEquals('active', $userPack->status);
        
        // Vérifier que la notification a été envoyée
        Notification::assertSentTo($user, WelcomeNotification::class);
    }

    /** @test */
    public function it_can_update_invitation_status()
    {
        // Créer un utilisateur
        $user = User::factory()->create([
            'email' => 'invite@example.com'
        ]);

        // Mettre à jour le statut de l'invitation
        $this->registrationService->updateInvitationStatus($user);

        // Vérifier que le statut a été mis à jour
        $invitation = ReferralInvitation::where('email', 'invite@example.com')->first();
        $this->assertEquals('registered', $invitation->status);
    }

    /** @test */
    public function it_can_process_commissions()
    {
        // Créer un UserPack
        $userPack = UserPack::factory()->create([
            'user_id' => User::factory()->create()->id,
            'pack_id' => $this->pack->id,
            'sponsor_id' => $this->sponsor->id
        ]);

        // Configurer le mock
        $this->commissionService->shouldReceive('distributeCommissions')
            ->once()
            ->with($userPack, 1)
            ->andReturn(true);

        // Traiter les commissions
        $result = $this->registrationService->processCommissions($userPack, 1);

        // Vérifier que les commissions ont été traitées
        $this->assertTrue($result);
    }
}
