<?php

namespace Tests\Unit\Services;

use App\Models\Pack;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Services\CodeGenerationService;
use App\Services\CommissionService;
use App\Services\PackService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PackServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $packService;
    protected $codeGenerationService;
    protected $walletService;
    protected $commissionService;
    protected $user;
    protected $pack;
    protected $wallet;
    protected $walletSystem;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer des mocks pour les services dépendants
        $this->codeGenerationService = Mockery::mock(CodeGenerationService::class);
        $this->walletService = Mockery::mock(WalletService::class);
        $this->commissionService = Mockery::mock(CommissionService::class);

        // Créer le service avec les mocks
        $this->packService = new PackService(
            $this->codeGenerationService,
            $this->walletService,
            $this->commissionService
        );

        // Créer les données de test
        $this->user = User::factory()->create();
        $this->pack = Pack::factory()->create([
            'name' => 'Premium',
            'price' => 100
        ]);
        $this->wallet = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 500
        ]);
        $this->walletSystem = WalletSystem::factory()->create([
            'balance' => 1000
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_renew_pack_with_wallet_payment()
    {
        // Configurer les mocks
        $this->walletService->shouldReceive('withdrawFunds')
            ->once()
            ->andReturn(true);
        
        $this->walletService->shouldReceive('recordSystemTransaction')
            ->once()
            ->andReturn(true);
        
        $this->commissionService->shouldReceive('distributeCommissions')
            ->once()
            ->andReturn(true);

        // Créer un UserPack existant
        $userPack = UserPack::factory()->create([
            'user_id' => $this->user->id,
            'pack_id' => $this->pack->id,
            'status' => 'active',
            'expiry_date' => now()->subDay(), // Expiré hier
        ]);

        // Données de paiement
        $paymentData = [
            'payment_method' => 'solifin-wallet',
            'amount' => 100,
            'currency' => 'USD',
            'payment_type' => 'renewal',
            'fees' => 0,
            'frais_api' => 0,
            'taux_de_change' => 1,
            'montantusd_sans_frais_api' => 100,
        ];

        // Exécuter le renouvellement
        $result = $this->packService->renewPack($this->user, $userPack, $paymentData, 1);

        // Assertions
        $this->assertInstanceOf(UserPack::class, $result);
        $this->assertEquals('active', $result->status);
        $this->assertTrue($result->expiry_date > now());
    }

    /** @test */
    public function it_can_purchase_new_pack_with_wallet_payment()
    {
        // Configurer les mocks
        $referralData = [
            'referral_code' => 'SPRP0001',
            'referral_link' => 'http://localhost:5173/register?referral_code=SPRP0001',
            'referral_letter' => 'P',
            'referral_number' => '0001',
            'referral_prefix' => 'SPR',
        ];

        $this->codeGenerationService->shouldReceive('generatePackReferralCode')
            ->once()
            ->with($this->pack->name)
            ->andReturn($referralData);
        
        $this->walletService->shouldReceive('withdrawFunds')
            ->once()
            ->andReturn(true);
        
        $this->walletService->shouldReceive('recordSystemTransaction')
            ->once()
            ->andReturn(true);
        
        $this->commissionService->shouldReceive('distributeCommissions')
            ->once()
            ->andReturn(true);

        // Données de paiement
        $paymentData = [
            'payment_method' => 'solifin-wallet',
            'amount' => 100,
            'currency' => 'USD',
            'payment_type' => 'purchase',
            'fees' => 0,
            'frais_api' => 0,
            'taux_de_change' => 1,
            'montantusd_sans_frais_api' => 100,
        ];

        // Exécuter l'achat
        $result = $this->packService->purchaseNewPack($this->user, $this->pack, $paymentData, 1);

        // Assertions
        $this->assertInstanceOf(UserPack::class, $result);
        $this->assertEquals('active', $result->status);
        $this->assertEquals($this->user->id, $result->user_id);
        $this->assertEquals($this->pack->id, $result->pack_id);
        $this->assertEquals($referralData['referral_code'], $result->referral_code);
        $this->assertTrue($result->expiry_date > now());
    }

    /** @test */
    public function it_can_purchase_new_pack_with_external_payment()
    {
        // Configurer les mocks
        $referralData = [
            'referral_code' => 'SPRP0001',
            'referral_link' => 'http://localhost:5173/register?referral_code=SPRP0001',
            'referral_letter' => 'P',
            'referral_number' => '0001',
            'referral_prefix' => 'SPR',
        ];

        $this->codeGenerationService->shouldReceive('generatePackReferralCode')
            ->once()
            ->with($this->pack->name)
            ->andReturn($referralData);
        
        $this->walletService->shouldReceive('recordTransaction')
            ->once()
            ->andReturn(true);
        
        $this->walletService->shouldReceive('recordSystemTransaction')
            ->once()
            ->andReturn(true);
        
        $this->commissionService->shouldReceive('distributeCommissions')
            ->once()
            ->andReturn(true);

        // Données de paiement
        $paymentData = [
            'payment_method' => 'mobile-money',
            'amount' => 100,
            'currency' => 'USD',
            'payment_type' => 'purchase',
            'fees' => 2,
            'frais_api' => 1,
            'taux_de_change' => 1,
            'montantusd_sans_frais_api' => 97,
            'payment_details' => [
                'provider' => 'mpesa',
                'phone' => '243123456789'
            ]
        ];

        // Exécuter l'achat
        $result = $this->packService->purchaseNewPack($this->user, $this->pack, $paymentData, 1);

        // Assertions
        $this->assertInstanceOf(UserPack::class, $result);
        $this->assertEquals('active', $result->status);
        $this->assertEquals($this->user->id, $result->user_id);
        $this->assertEquals($this->pack->id, $result->pack_id);
        $this->assertEquals($referralData['referral_code'], $result->referral_code);
        $this->assertTrue($result->expiry_date > now());
    }
}
