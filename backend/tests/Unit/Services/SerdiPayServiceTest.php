<?php

namespace Tests\Unit\Services;

use App\Models\SerdiPayTransaction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\SerdiPayService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Mockery;
use Tests\TestCase;

class SerdiPayServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $serdiPayService;
    protected $mockHandler;
    protected $handlerStack;
    protected $mockClient;
    protected $user;
    protected $wallet;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer un mock pour le client HTTP
        $this->mockHandler = new MockHandler();
        $this->handlerStack = HandlerStack::create($this->mockHandler);
        $this->mockClient = new Client(['handler' => $this->handlerStack]);

        // Créer le service avec le client mocké
        $this->serdiPayService = Mockery::mock(SerdiPayService::class)->makePartial();
        $this->serdiPayService->shouldReceive('getClient')->andReturn($this->mockClient);

        // Configurer les variables d'environnement pour les tests
        $this->app['config']->set('services.serdipay.base_url', 'https://serdipay.com/api/public-api/v1');
        $this->app['config']->set('services.serdipay.api_id', 'test_api_id');
        $this->app['config']->set('services.serdipay.api_password', 'test_api_password');
        $this->app['config']->set('services.serdipay.merchant_code', 'test_merchant_code');
        $this->app['config']->set('services.serdipay.merchant_pin', 'test_merchant_pin');
        $this->app['config']->set('services.serdipay.email', 'test@example.com');
        $this->app['config']->set('services.serdipay.password', 'test_password');

        // Créer les données de test
        $this->user = User::factory()->create();
        $this->wallet = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 500
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_get_auth_token()
    {
        // Vider le cache pour s'assurer que le token sera récupéré
        Cache::forget('serdipay_access_token');

        // Configurer la réponse simulée
        $this->mockHandler->append(
            new Response(200, [], json_encode([
                'access_token' => 'test_token_123',
                'expires_in' => 86400
            ]))
        );

        // Remplacer la méthode getAuthToken pour utiliser notre client mocké
        $reflectionClass = new \ReflectionClass(SerdiPayService::class);
        $reflectionProperty = $reflectionClass->getProperty('client');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->serdiPayService, $this->mockClient);

        // Appeler la méthode
        $token = $this->serdiPayService->getAuthToken();

        // Vérifier le résultat
        $this->assertEquals('test_token_123', $token);
        $this->assertTrue(Cache::has('serdipay_access_token'));
        $this->assertEquals('test_token_123', Cache::get('serdipay_access_token'));
    }

    /** @test */
    public function it_returns_null_when_auth_fails()
    {
        // Vider le cache pour s'assurer que le token sera récupéré
        Cache::forget('serdipay_access_token');

        // Configurer la réponse simulée pour un échec d'authentification
        $this->mockHandler->append(
            new Response(401, [], json_encode([
                'message' => 'Invalid credentials'
            ]))
        );

        // Remplacer la méthode getAuthToken pour utiliser notre client mocké
        $reflectionClass = new \ReflectionClass(SerdiPayService::class);
        $reflectionProperty = $reflectionClass->getProperty('client');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->serdiPayService, $this->mockClient);

        // Appeler la méthode
        $token = $this->serdiPayService->getAuthToken();

        // Vérifier le résultat
        $this->assertNull($token);
        $this->assertFalse(Cache::has('serdipay_access_token'));
    }

    /** @test */
    public function it_can_initiate_mobile_money_payment()
    {
        // Configurer le mock pour simuler un token d'authentification valide
        $this->serdiPayService->shouldReceive('getAuthToken')
            ->once()
            ->andReturn('test_token_123');

        // Configurer la réponse simulée pour l'initiation de paiement
        $this->mockHandler->append(
            new Response(200, [], json_encode([
                'status' => 'success',
                'message' => 'Payment initiated successfully',
                'payment' => [
                    'sessionId' => 'test_session_123',
                    'transactionId' => 'test_transaction_123',
                    'status' => 'pending'
                ]
            ]))
        );

        // Remplacer la méthode getAuthToken pour utiliser notre client mocké
        $reflectionClass = new \ReflectionClass(SerdiPayService::class);
        $reflectionProperty = $reflectionClass->getProperty('client');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->serdiPayService, $this->mockClient);

        // Paramètres du paiement
        $phoneNumber = '243123456789';
        $amount = 100;
        $currency = 'USD';
        $paymentMethod = 'MP'; // M-Pesa
        $userId = $this->user->id;
        $walletId = $this->wallet->id;
        $email = 'test@example.com';
        $purpose = 'pack_purchase';
        $reference = 'REF123';

        // Appeler la méthode
        $result = $this->serdiPayService->initiatePayment(
            $phoneNumber,
            $amount,
            $currency,
            $paymentMethod,
            $userId,
            $walletId,
            $email,
            $purpose,
            $reference
        );

        // Vérifier le résultat
        $this->assertTrue($result['success']);
        $this->assertEquals('Paiement initié avec succès', $result['message']);
        $this->assertEquals('test_session_123', $result['session_id']);
        $this->assertEquals('test_transaction_123', $result['transaction_id']);

        // Vérifier que la transaction a été enregistrée dans la base de données
        $transaction = SerdiPayTransaction::where('session_id', 'test_session_123')->first();
        $this->assertNotNull($transaction);
        $this->assertEquals($userId, $transaction->user_id);
        $this->assertEquals($walletId, $transaction->wallet_id);
        $this->assertEquals($phoneNumber, $transaction->phone_number);
        $this->assertEquals($amount, $transaction->amount);
        $this->assertEquals($currency, $transaction->currency);
        $this->assertEquals('pending', $transaction->status);
        $this->assertEquals('payment', $transaction->type);
        $this->assertEquals('client_to_merchant', $transaction->direction);
        $this->assertEquals($purpose, $transaction->purpose);
        $this->assertEquals($reference, $transaction->reference);

        // Vérifier que la transaction wallet a été créée
        $walletTransaction = WalletTransaction::where('wallet_id', $walletId)
            ->whereJsonContains('metadata->session_id', 'test_session_123')
            ->first();
        $this->assertNotNull($walletTransaction);
        $this->assertEquals($amount, $walletTransaction->amount);
        $this->assertEquals('purchase', $walletTransaction->type);
        $this->assertEquals('pending', $walletTransaction->status);
    }

    /** @test */
    public function it_can_initiate_card_payment()
    {
        // Configurer le mock pour simuler un token d'authentification valide
        $this->serdiPayService->shouldReceive('getAuthToken')
            ->once()
            ->andReturn('test_token_123');

        // Configurer la réponse simulée pour l'initiation de paiement
        $this->mockHandler->append(
            new Response(200, [], json_encode([
                'status' => 'success',
                'message' => 'Payment initiated successfully',
                'payment' => [
                    'sessionId' => 'test_session_456',
                    'transactionId' => 'test_transaction_456',
                    'status' => 'pending'
                ]
            ]))
        );

        // Remplacer la méthode getAuthToken pour utiliser notre client mocké
        $reflectionClass = new \ReflectionClass(SerdiPayService::class);
        $reflectionProperty = $reflectionClass->getProperty('client');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->serdiPayService, $this->mockClient);

        // Paramètres du paiement par carte
        $amount = 100;
        $currency = 'USD';
        $paymentMethod = 'VISA';
        $userId = $this->user->id;
        $walletId = $this->wallet->id;
        $email = 'test@example.com';
        $purpose = 'pack_purchase';
        $reference = 'REF456';
        $cardData = [
            'cardNumber' => '4111111111111111',
            'cardHolder' => 'John Doe',
            'expiryDate' => '12/25',
            'cvv' => '123'
        ];

        // Appeler la méthode
        $result = $this->serdiPayService->initiatePayment(
            null, // pas de numéro de téléphone pour les paiements par carte
            $amount,
            $currency,
            $paymentMethod,
            $userId,
            $walletId,
            $email,
            $purpose,
            $reference,
            $cardData
        );

        // Vérifier le résultat
        $this->assertTrue($result['success']);
        $this->assertEquals('Paiement initié avec succès', $result['message']);
        $this->assertEquals('test_session_456', $result['session_id']);
        $this->assertEquals('test_transaction_456', $result['transaction_id']);

        // Vérifier que la transaction a été enregistrée dans la base de données
        $transaction = SerdiPayTransaction::where('session_id', 'test_session_456')->first();
        $this->assertNotNull($transaction);
        $this->assertEquals($userId, $transaction->user_id);
        $this->assertEquals($walletId, $transaction->wallet_id);
        $this->assertEquals($amount, $transaction->amount);
        $this->assertEquals($currency, $transaction->currency);
        $this->assertEquals('pending', $transaction->status);
        $this->assertEquals('payment', $transaction->type);
        $this->assertEquals('client_to_merchant', $transaction->direction);
        $this->assertEquals($purpose, $transaction->purpose);
        $this->assertEquals($reference, $transaction->reference);
        $this->assertEquals('XXXX-XXXX-XXXX-1111', $transaction->card_number);
        $this->assertEquals('John Doe', $transaction->card_holder_name);
        $this->assertEquals('12/25', $transaction->card_expiry);
        $this->assertEquals('VISA', $transaction->card_type);
    }

    /** @test */
    public function it_can_check_transaction_status()
    {
        // Créer une transaction dans la base de données
        $transaction = SerdiPayTransaction::create([
            'user_id' => $this->user->id,
            'wallet_id' => $this->wallet->id,
            'email' => 'test@example.com',
            'phone_number' => '243123456789',
            'payment_method' => 'MP',
            'payment_type' => 'mobile_money',
            'amount' => 100,
            'currency' => 'USD',
            'session_id' => 'test_session_789',
            'reference' => 'REF789',
            'type' => 'payment',
            'direction' => 'client_to_merchant',
            'status' => 'pending',
            'purpose' => 'pack_purchase',
            'request_data' => [],
            'response_data' => []
        ]);

        // Créer une transaction wallet associée
        $walletTransaction = WalletTransaction::create([
            'wallet_id' => $this->wallet->id,
            'amount' => 100,
            'type' => 'purchase',
            'status' => 'pending',
            'metadata' => [
                'payment_method' => 'serdipay',
                'session_id' => 'test_session_789',
                'phone_number' => '243123456789',
                'serdipay_payment_method' => 'MP',
                'payment_type' => 'mobile_money',
                'currency' => 'USD',
                'reference' => 'REF789'
            ]
        ]);

        // Configurer le mock pour simuler un token d'authentification valide
        $this->serdiPayService->shouldReceive('getAuthToken')
            ->once()
            ->andReturn('test_token_123');

        // Configurer la réponse simulée pour la vérification de statut
        $this->mockHandler->append(
            new Response(200, [], json_encode([
                'status' => 'success',
                'message' => 'Transaction status retrieved successfully',
                'payment' => [
                    'sessionId' => 'test_session_789',
                    'transactionId' => 'test_transaction_789',
                    'status' => 'success',
                    'amount' => 100,
                    'currency' => 'USD'
                ]
            ]))
        );

        // Remplacer la méthode getAuthToken pour utiliser notre client mocké
        $reflectionClass = new \ReflectionClass(SerdiPayService::class);
        $reflectionProperty = $reflectionClass->getProperty('client');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($this->serdiPayService, $this->mockClient);

        // Appeler la méthode
        $result = $this->serdiPayService->checkTransactionStatus('test_session_789');

        // Vérifier le résultat
        $this->assertEquals('success', $result['status']);
        $this->assertEquals('Transaction status retrieved successfully', $result['message']);

        // Vérifier que la transaction a été mise à jour dans la base de données
        $transaction->refresh();
        $this->assertEquals('success', $transaction->status);
        $this->assertEquals('test_transaction_789', $transaction->transaction_id);
        $this->assertArrayHasKey('status_check', $transaction->response_data);

        // Vérifier que la transaction wallet a été mise à jour
        $walletTransaction->refresh();
        $this->assertEquals('completed', $walletTransaction->status);

        // Vérifier que le solde du wallet a été mis à jour
        $this->wallet->refresh();
        $this->assertEquals(600, $this->wallet->balance); // 500 + 100
    }

    /** @test */
    public function it_can_handle_callback()
    {
        // Créer une transaction dans la base de données
        $transaction = SerdiPayTransaction::create([
            'user_id' => $this->user->id,
            'wallet_id' => $this->wallet->id,
            'email' => 'test@example.com',
            'phone_number' => '243123456789',
            'payment_method' => 'MP',
            'payment_type' => 'mobile_money',
            'amount' => 100,
            'currency' => 'USD',
            'session_id' => 'test_session_callback',
            'reference' => 'REF_CALLBACK',
            'type' => 'payment',
            'direction' => 'client_to_merchant',
            'status' => 'pending',
            'purpose' => 'pack_purchase',
            'request_data' => [],
            'response_data' => []
        ]);

        // Créer une transaction wallet associée
        $walletTransaction = WalletTransaction::create([
            'wallet_id' => $this->wallet->id,
            'amount' => 100,
            'type' => 'purchase',
            'status' => 'pending',
            'metadata' => [
                'payment_method' => 'serdipay',
                'session_id' => 'test_session_callback',
                'phone_number' => '243123456789',
                'serdipay_payment_method' => 'MP',
                'payment_type' => 'mobile_money',
                'currency' => 'USD',
                'reference' => 'REF_CALLBACK'
            ]
        ]);

        // Données de callback
        $callbackData = [
            'status' => 'success',
            'message' => 'Payment successful',
            'payment' => [
                'sessionId' => 'test_session_callback',
                'sessionStatus' => 'completed',
                'transactionId' => 'test_transaction_callback',
                'status' => 'success',
                'amount' => 100,
                'currency' => 'USD'
            ]
        ];

        // Appeler la méthode
        $result = $this->serdiPayService->handleCallback($callbackData);

        // Vérifier le résultat
        $this->assertTrue($result['success']);
        $this->assertEquals('Callback processed successfully', $result['message']);

        // Vérifier que la transaction a été mise à jour dans la base de données
        $transaction->refresh();
        $this->assertEquals('success', $transaction->status);
        $this->assertEquals('test_transaction_callback', $transaction->transaction_id);
        $this->assertArrayHasKey('callback', $transaction->response_data);

        // Vérifier que la transaction wallet a été mise à jour
        $walletTransaction->refresh();
        $this->assertEquals('completed', $walletTransaction->status);

        // Vérifier que le solde du wallet a été mis à jour
        $this->wallet->refresh();
        $this->assertEquals(600, $this->wallet->balance); // 500 + 100
    }

    /** @test */
    public function it_validates_phone_number_correctly()
    {
        // Tester des numéros valides
        $this->assertTrue($this->serdiPayService->validatePhoneNumber('243123456789'));
        $this->assertTrue($this->serdiPayService->validatePhoneNumber('243987654321'));
        $this->assertTrue($this->serdiPayService->validatePhoneNumber('237123456789'));
        
        // Tester des numéros invalides
        $this->assertFalse($this->serdiPayService->validatePhoneNumber('12345')); // Trop court
        $this->assertFalse($this->serdiPayService->validatePhoneNumber('abcdefghijk')); // Non numérique
        $this->assertFalse($this->serdiPayService->validatePhoneNumber('')); // Vide
        $this->assertFalse($this->serdiPayService->validatePhoneNumber(null)); // Null
    }

    /** @test */
    public function it_validates_payment_method_correctly()
    {
        // Tester des méthodes valides
        $this->assertTrue($this->serdiPayService->validatePaymentMethod('MP')); // M-Pesa
        $this->assertTrue($this->serdiPayService->validatePaymentMethod('OM')); // Orange Money
        $this->assertTrue($this->serdiPayService->validatePaymentMethod('AM')); // Airtel Money
        $this->assertTrue($this->serdiPayService->validatePaymentMethod('AF')); // AfriMoney
        $this->assertTrue($this->serdiPayService->validatePaymentMethod('VISA')); // Visa
        $this->assertTrue($this->serdiPayService->validatePaymentMethod('MC')); // MasterCard
        
        // Tester des méthodes invalides
        $this->assertFalse($this->serdiPayService->validatePaymentMethod('XYZ')); // Non supportée
        $this->assertFalse($this->serdiPayService->validatePaymentMethod('')); // Vide
        $this->assertFalse($this->serdiPayService->validatePaymentMethod(null)); // Null
    }

    /** @test */
    public function it_determines_payment_type_correctly()
    {
        // Tester les types de paiement mobile
        $this->assertEquals('mobile_money', $this->serdiPayService->determinePaymentType('MP'));
        $this->assertEquals('mobile_money', $this->serdiPayService->determinePaymentType('OM'));
        $this->assertEquals('mobile_money', $this->serdiPayService->determinePaymentType('AM'));
        $this->assertEquals('mobile_money', $this->serdiPayService->determinePaymentType('AF'));
        
        // Tester les types de paiement par carte
        $this->assertEquals('card', $this->serdiPayService->determinePaymentType('VISA'));
        $this->assertEquals('card', $this->serdiPayService->determinePaymentType('MC'));
        
        // Tester un type inconnu
        $this->assertEquals('unknown', $this->serdiPayService->determinePaymentType('XYZ'));
    }

    /** @test */
    public function it_validates_card_data_correctly()
    {
        // Données de carte valides
        $validCardData = [
            'cardNumber' => '4111111111111111',
            'cardHolder' => 'John Doe',
            'expiryDate' => '12/25',
            'cvv' => '123'
        ];
        
        // Données de carte incomplètes
        $incompleteCardData = [
            'cardNumber' => '4111111111111111',
            'cardHolder' => 'John Doe',
            // Manque expiryDate et cvv
        ];
        
        // Données de carte avec numéro invalide
        $invalidCardNumberData = [
            'cardNumber' => '411111', // Trop court
            'cardHolder' => 'John Doe',
            'expiryDate' => '12/25',
            'cvv' => '123'
        ];
        
        // Tester la validation
        $this->assertTrue($this->serdiPayService->validateCardData($validCardData));
        $this->assertFalse($this->serdiPayService->validateCardData($incompleteCardData));
        $this->assertFalse($this->serdiPayService->validateCardData($invalidCardNumberData));
        $this->assertFalse($this->serdiPayService->validateCardData(null));
        $this->assertFalse($this->serdiPayService->validateCardData([]));
    }

    /** @test */
    public function it_masks_card_number_correctly()
    {
        $this->assertEquals('XXXX-XXXX-XXXX-1111', $this->serdiPayService->maskCardNumber('4111111111111111'));
        $this->assertEquals('XXXX-XXXX-XXXX-4321', $this->serdiPayService->maskCardNumber('1234567890124321'));
        $this->assertEquals('', $this->serdiPayService->maskCardNumber(''));
        $this->assertEquals('', $this->serdiPayService->maskCardNumber(null));
    }
}
