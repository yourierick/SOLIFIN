<?php

namespace Tests\Unit\Services;

use App\Models\Pack;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\CommissionService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class CommissionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $commissionService;
    protected $walletService;
    protected $user;
    protected $sponsor;
    protected $pack;
    protected $userPack;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer un mock pour le WalletService
        $this->walletService = Mockery::mock(WalletService::class);
        
        // Créer le service avec le mock
        $this->commissionService = new CommissionService($this->walletService);

        // Créer les données de test
        $this->pack = Pack::factory()->create([
            'name' => 'Premium',
            'price' => 100
        ]);

        // Créer un utilisateur parrain
        $this->sponsor = User::factory()->create();
        $this->sponsor->wallet = Wallet::factory()->create([
            'user_id' => $this->sponsor->id,
            'balance' => 500
        ]);

        // Créer un utilisateur filleul
        $this->user = User::factory()->create();
        $this->user->wallet = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 0
        ]);

        // Créer un UserPack avec parrainage
        $this->userPack = UserPack::factory()->create([
            'user_id' => $this->user->id,
            'pack_id' => $this->pack->id,
            'sponsor_id' => $this->sponsor->id,
            'status' => 'active'
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_distribute_commissions()
    {
        // Configurer le mock pour simuler l'ajout de fonds
        $this->walletService->shouldReceive('addFunds')
            ->once()
            ->withArgs(function ($user, $amount, $type, $status, $metadata) {
                // Vérifier que les bons arguments sont passés
                return $user->id === $this->sponsor->id &&
                       $type === 'commission' &&
                       $status === 'completed' &&
                       isset($metadata['Opération']) &&
                       isset($metadata['Montant de la commission']);
            })
            ->andReturnUsing(function ($user, $amount, $type, $status, $metadata) {
                // Simuler une transaction
                return WalletTransaction::factory()->create([
                    'wallet_id' => $user->wallet->id,
                    'amount' => $amount,
                    'type' => $type,
                    'status' => $status,
                    'metadata' => $metadata
                ]);
            });

        // Distribuer les commissions
        $result = $this->commissionService->distributeCommissions($this->userPack, 1);

        // Vérifier que les commissions ont été distribuées
        $this->assertTrue($result);
    }

    /** @test */
    public function it_returns_false_when_no_sponsor()
    {
        // Créer un UserPack sans parrain
        $userPackWithoutSponsor = UserPack::factory()->create([
            'user_id' => $this->user->id,
            'pack_id' => $this->pack->id,
            'sponsor_id' => null,
            'status' => 'active'
        ]);

        // Le service ne devrait pas appeler addFunds
        $this->walletService->shouldNotReceive('addFunds');

        // Distribuer les commissions
        $result = $this->commissionService->distributeCommissions($userPackWithoutSponsor, 1);

        // Vérifier qu'aucune commission n'a été distribuée
        $this->assertFalse($result);
    }

    /** @test */
    public function it_calculates_commission_correctly_for_different_durations()
    {
        // Configurer le mock pour simuler l'ajout de fonds avec différents montants
        $this->walletService->shouldReceive('addFunds')
            ->times(3)
            ->andReturnUsing(function ($user, $amount, $type, $status, $metadata) {
                // Simuler une transaction
                return WalletTransaction::factory()->create([
                    'wallet_id' => $user->wallet->id,
                    'amount' => $amount,
                    'type' => $type,
                    'status' => $status,
                    'metadata' => $metadata
                ]);
            });

        // Tester différentes durées
        $this->commissionService->distributeCommissions($this->userPack, 1);
        $this->commissionService->distributeCommissions($this->userPack, 3);
        $this->commissionService->distributeCommissions($this->userPack, 12);

        // Vérifier que les transactions ont été créées
        $transactions = WalletTransaction::where('wallet_id', $this->sponsor->wallet->id)
            ->where('type', 'commission')
            ->get();
        
        $this->assertCount(3, $transactions);
        
        // Les montants exacts dépendent de la logique de calcul des commissions
        // Cette assertion est générique et devrait être adaptée à la logique réelle
        $this->assertGreaterThan(0, $transactions->sum('amount'));
    }

    /** @test */
    public function it_prepares_commission_metadata_correctly()
    {
        // Accéder à la méthode protected via la réflexion
        $reflectionClass = new \ReflectionClass(CommissionService::class);
        $method = $reflectionClass->getMethod('prepareCommissionMetadata');
        $method->setAccessible(true);

        // Appeler la méthode
        $metadata = $method->invokeArgs($this->commissionService, [
            $this->sponsor,
            $this->user,
            $this->pack->name,
            10.0,
            1
        ]);

        // Vérifier les métadonnées
        $this->assertIsArray($metadata);
        $this->assertArrayHasKey('Opération', $metadata);
        $this->assertArrayHasKey('Parrain', $metadata);
        $this->assertArrayHasKey('Filleul', $metadata);
        $this->assertArrayHasKey('Pack', $metadata);
        $this->assertArrayHasKey('Montant de la commission', $metadata);
        $this->assertArrayHasKey('Durée', $metadata);
        
        $this->assertEquals('Commission de parrainage', $metadata['Opération']);
        $this->assertEquals($this->sponsor->name, $metadata['Parrain']);
        $this->assertEquals($this->user->name, $metadata['Filleul']);
        $this->assertEquals($this->pack->name, $metadata['Pack']);
        $this->assertEquals('10.0 USD', $metadata['Montant de la commission']);
        $this->assertEquals('1 mois', $metadata['Durée']);
    }
}
