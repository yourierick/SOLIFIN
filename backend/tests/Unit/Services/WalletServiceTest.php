<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\WalletTransaction;
use App\Models\WalletSystemTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $walletService;
    protected $user;
    protected $wallet;
    protected $walletSystem;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = new WalletService();
        
        // Créer les données de test
        $this->user = User::factory()->create();
        $this->wallet = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 500
        ]);
        $this->walletSystem = WalletSystem::factory()->create([
            'balance' => 1000
        ]);
    }

    /** @test */
    public function it_can_create_wallet()
    {
        // Créer un nouvel utilisateur sans wallet
        $newUser = User::factory()->create();
        
        // Créer un wallet pour cet utilisateur
        $wallet = $this->walletService->createWallet($newUser);
        
        // Vérifier que le wallet a été créé correctement
        $this->assertInstanceOf(Wallet::class, $wallet);
        $this->assertEquals($newUser->id, $wallet->user_id);
        $this->assertEquals(0, $wallet->balance);
        $this->assertTrue($newUser->wallet()->exists());
    }

    /** @test */
    public function it_can_withdraw_funds()
    {
        // Données de métadonnées
        $metadata = [
            'description' => 'Test de retrait',
            'operation' => 'test'
        ];
        
        // Retirer des fonds
        $initialBalance = $this->wallet->balance;
        $amount = 100;
        
        $transaction = $this->walletService->withdrawFunds(
            $this->user,
            $amount,
            'withdrawal',
            'completed',
            $metadata
        );
        
        // Recharger le wallet depuis la base de données
        $this->wallet->refresh();
        
        // Vérifier que le retrait a été effectué correctement
        $this->assertInstanceOf(WalletTransaction::class, $transaction);
        $this->assertEquals($initialBalance - $amount, $this->wallet->balance);
        $this->assertEquals($amount, $transaction->amount);
        $this->assertEquals('withdrawal', $transaction->type);
        $this->assertEquals('completed', $transaction->status);
        $this->assertEquals($metadata, $transaction->metadata);
    }

    /** @test */
    public function it_can_add_funds()
    {
        // Données de métadonnées
        $metadata = [
            'description' => 'Test de dépôt',
            'operation' => 'test'
        ];
        
        // Ajouter des fonds
        $initialBalance = $this->wallet->balance;
        $amount = 100;
        
        $transaction = $this->walletService->addFunds(
            $this->user,
            $amount,
            'deposit',
            'completed',
            $metadata
        );
        
        // Recharger le wallet depuis la base de données
        $this->wallet->refresh();
        
        // Vérifier que le dépôt a été effectué correctement
        $this->assertInstanceOf(WalletTransaction::class, $transaction);
        $this->assertEquals($initialBalance + $amount, $this->wallet->balance);
        $this->assertEquals($amount, $transaction->amount);
        $this->assertEquals('deposit', $transaction->type);
        $this->assertEquals('completed', $transaction->status);
        $this->assertEquals($metadata, $transaction->metadata);
    }

    /** @test */
    public function it_can_record_transaction()
    {
        // Données de métadonnées
        $metadata = [
            'description' => 'Test de transaction',
            'operation' => 'test'
        ];
        
        // Enregistrer une transaction sans modifier le solde
        $transaction = $this->walletService->recordTransaction(
            $this->user,
            100,
            'external',
            'completed',
            $metadata
        );
        
        // Vérifier que la transaction a été enregistrée correctement
        $this->assertInstanceOf(WalletTransaction::class, $transaction);
        $this->assertEquals(100, $transaction->amount);
        $this->assertEquals('external', $transaction->type);
        $this->assertEquals('completed', $transaction->status);
        $this->assertEquals($metadata, $transaction->metadata);
        
        // Vérifier que le solde n'a pas été modifié
        $this->wallet->refresh();
        $this->assertEquals(500, $this->wallet->balance);
    }

    /** @test */
    public function it_can_record_system_transaction()
    {
        // Données de métadonnées
        $metadata = [
            'description' => 'Test de transaction système',
            'operation' => 'test',
            'user' => $this->user->name
        ];
        
        // Enregistrer une transaction système
        $transaction = $this->walletService->recordSystemTransaction(
            100,
            'sales',
            'completed',
            $metadata
        );
        
        // Vérifier que la transaction a été enregistrée correctement
        $this->assertInstanceOf(WalletSystemTransaction::class, $transaction);
        $this->assertEquals(100, $transaction->amount);
        $this->assertEquals('sales', $transaction->type);
        $this->assertEquals('completed', $transaction->status);
        $this->assertEquals($metadata, $transaction->metadata);
    }

    /** @test */
    public function it_can_prepare_transaction_metadata()
    {
        // Données de base
        $user = $this->user;
        $packName = 'Premium';
        $durationMonths = 3;
        $paymentData = [
            'payment_method' => 'mobile-money',
            'payment_type' => 'purchase',
            'amount' => 100,
            'currency' => 'USD',
            'fees' => 2,
            'frais_api' => 1,
            'taux_de_change' => 1,
            'payment_details' => [
                'provider' => 'mpesa',
                'phone' => '243123456789'
            ]
        ];
        $operation = 'purchase';
        
        // Préparer les métadonnées
        $metadata = $this->walletService->prepareTransactionMetadata(
            $user,
            $packName,
            $durationMonths,
            $paymentData,
            $operation
        );
        
        // Vérifier les métadonnées
        $this->assertIsArray($metadata);
        $this->assertArrayHasKey('Opération', $metadata);
        $this->assertArrayHasKey('Nom du pack', $metadata);
        $this->assertArrayHasKey('Durée de souscription', $metadata);
        $this->assertArrayHasKey('Type de paiement', $metadata);
        $this->assertArrayHasKey('Méthode de paiement', $metadata);
        $this->assertArrayHasKey('Détails de paiement', $metadata);
        $this->assertArrayHasKey('Dévise', $metadata);
        $this->assertArrayHasKey('Montant net payé', $metadata);
        $this->assertArrayHasKey('Description', $metadata);
        
        $this->assertEquals('Achat du pack Premium', $metadata['Opération']);
        $this->assertEquals('Premium', $metadata['Nom du pack']);
        $this->assertEquals('3 mois', $metadata['Durée de souscription']);
        $this->assertEquals('purchase', $metadata['Type de paiement']);
        $this->assertEquals('mobile-money', $metadata['Méthode de paiement']);
        $this->assertEquals($paymentData['payment_details'], $metadata['Détails de paiement']);
        $this->assertEquals('USD', $metadata['Dévise']);
        $this->assertEquals('100 USD', $metadata['Montant net payé']);
    }
}
