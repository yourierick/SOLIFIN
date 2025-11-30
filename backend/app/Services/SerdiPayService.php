<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\SerdiPayTransaction;
use App\Models\WalletTransaction;
use App\Models\Wallet;
use Illuminate\Support\Facades\Config;

class SerdiPayService
{
    protected $baseUrl;
    protected $apiId;
    protected $apiPassword;
    protected $merchantCode;
    protected $merchantPin;
    protected $tokenCacheKey = 'serdipay_access_token';
    protected $client;
    
    public function __construct()
    {
        $this->baseUrl = env('SERDIPAY_BASE_TEST_URL', 'https://api.kenzo.serdipay.cloud/api/public-api/v1');
        $this->apiId = env('SERDIPAY_API_ID');
        $this->apiPassword = env('SERDIPAY_API_PASSWORD');
        $this->merchantCode = env('SERDIPAY_MERCHANT_CODE');
        $this->merchantPin = env('SERDIPAY_MERCHANT_PIN');
        
        // // Logger les informations de configuration au démarrage
        // Log::info('SerdiPay Service Initialization', [
        //     'base_url' => $this->baseUrl,
        //     'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
        //     'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        //     'http_host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        //     'domain' => env('APP_URL', 'unknown'),
        // ]);
        
        // Initialiser le client Guzzle avec des options par défaut
        $this->client = new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'http_errors' => false,
            'verify' => true,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'SolifinExpress/1.0 (Laravel)',
                'Origin' => 'https://solifinexpress.com',
                'Referer' => 'https://solifinexpress.com',
            ],
            'curl' => [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ],
        ]);
    }
    
    /**
     * Obtient un token d'authentification auprès de l'API SerdiPay
     * 
     * @return string|null Le token d'accès ou null en cas d'échec
     */
    public function getAuthToken()
    {
        try {
            // Logger la tentative d'authentification
            Log::info('SerdiPay authentication attempt', [
                'url' => $this->baseUrl . '/merchant/get-token',
                'email' => Config::get('app.serdipay_email'),
                'timestamp' => now()->toDateTimeString(),
            ]);
            
            $response = $this->client->request('POST', $this->baseUrl . '/merchant/get-token', [
                'json' => [
                    'email' => Config::get('app.serdipay_email'),
                    'password' => Config::get('app.serdipay_password'),
                ]
            ]);
            
            $statusCode = $response->getStatusCode();
            $data = json_decode($response->getBody()->getContents(), true);
            
            // Logger la réponse complète
            Log::info('SerdiPay authentication response', [
                'status_code' => $statusCode,
                'response_headers' => $response->getHeaders(),
                'response_body' => $data,
            ]);
            
            if ($statusCode === 200) {
                if (isset($data['access_token'])) {
                    return $data['access_token'];
                }
            }
            
            Log::error('SerdiPay authentication failed', [
                'status' => $statusCode,
                'response' => $data,
                'server_info' => [
                    'ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
                    'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
                ],
            ]);
            
            return null;
        } catch (RequestException $e) {
            // Gestion spécifique des erreurs de requête Guzzle
            $responseBody = null;
            $responseHeaders = null;
            
            if ($e->hasResponse()) {
                $responseBody = $e->getResponse()->getBody()->getContents();
                $responseHeaders = $e->getResponse()->getHeaders();
            }
            
            Log::error('SerdiPay request exception', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'request_uri' => $e->getRequest()->getUri()->__toString(),
                'request_headers' => $e->getRequest()->getHeaders(),
                'request_body' => $e->getRequest()->getBody()->getContents(),
                'response_body' => $responseBody,
                'response_headers' => $responseHeaders,
                'server_info' => [
                    'ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
                    'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
                    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                ],
            ]);
            
            return null;
        } catch (GuzzleException $e) {
            // Gestion des autres exceptions Guzzle
            Log::error('SerdiPay Guzzle exception', [
                'message' => $e->getMessage()
            ]);
            
            return null;
        } catch (\Exception $e) {
            Log::error('SerdiPay authentication exception', [
                'message' => $e->getMessage(),
            ]);
            
            return null;
        }
    }
    
    /**
     * Initie un paiement via SerdiPay
     * 
     * @param string $phoneNumber Numéro de téléphone du client
     * @param float $amount Montant à payer
     * @param string $currency Devise (XAF, USD, etc.)
     * @param string $paymentMethod Méthode de paiement (MP, OM, AM, AF, MC, VISA)
     * @param int|null $userId ID de l'utilisateur (optionnel)
     * @param int|null $walletId ID du portefeuille (optionnel)
     * @param string|null $email Email de l'utilisateur (optionnel)
     * @param string|null $purpose But du paiement (optionnel, ex: 'pack_purchase')
     * @param string|null $reference Référence optionnelle pour le paiement
     * @param array|null $cardData Données de carte pour les paiements par carte (optionnel)
     * @return array Résultat de la requête avec statut et message
     */
    public function initiatePayment($phoneNumber = null, $amount, $currency, $paymentMethod, $userId = null, $walletId = null, $email = null, $purpose = null, $reference = null, $cardData = null)
    {
        $token = $this->getAuthToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement',
                'code' => 'auth_failed'
            ];
        }
        
        // Déterminer le type de paiement (mobile_money ou card)
        $paymentType = $this->determinePaymentType($paymentMethod);
        
        // Valider les données d'entrée
        if ($paymentType === 'mobile_money' && !$this->validatePhoneNumber($phoneNumber)) {
            return [
                'success' => false,
                'message' => 'Numéro de téléphone invalide',
                'code' => 'invalid_phone'
            ];
        }
        
        if (!$this->validatePaymentMethod($paymentMethod)) {
            return [
                'success' => false,
                'message' => 'Méthode de paiement non supportée',
                'code' => 'invalid_payment_method'
            ];
        }
        
        // Valider les données de carte pour les paiements par carte
        if ($paymentType === 'card' && !$this->validateCardData($cardData)) {
            return [
                'success' => false,
                'message' => 'Données de carte invalides ou incomplètes',
                'code' => 'invalid_card_data'
            ];
        }
        
        try {
            // Logger les détails de la requête de paiement
            Log::info('SerdiPay payment initiation', [
                'amount' => $amount,
                'currency' => $currency,
                'payment_method' => $paymentMethod,
                'phone' => $phoneNumber,
                'user_id' => $userId,
                'timestamp' => now()->toDateTimeString(),
            ]);
            
            $payload = [
                'api_id' => $this->apiId,
                'api_password' => $this->apiPassword,
                'merchantCode' => $this->merchantCode,
                'merchant_pin' => $this->merchantPin,
                'amount' => (float) $amount,
                'currency' => $currency,
            ];
            
            // Ajouter les données spécifiques au type de paiement
            if ($paymentType === 'mobile_money') {
                $payload['clientPhone'] = $phoneNumber;
                $payload['telecom'] = $paymentMethod;
            } else if ($paymentType === 'card') {
                $payload['card_number'] = $cardData['cardNumber'] ?? null;
                $payload['card_holder'] = $cardData['cardHolder'] ?? null;
                $payload['card_expiry'] = $cardData['expiryDate'] ?? null;
                $payload['card_cvv'] = $cardData['cvv'] ?? null;
                $payload['payment_method'] = $paymentMethod; // MC ou VISA
            }
            
            // Ajouter une référence si fournie
            if ($reference) {
                $payload['reference'] = $reference;
            }
            
            // Logger le payload avant l'envoi
            Log::info('SerdiPay payment payload', [
                'payload' => $payload,
                'endpoint' => $this->baseUrl . '/merchant/payment-client',
            ]);
            
            $response = $this->client->request('POST', $this->baseUrl . '/merchant/payment-client', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token
                ],
                'json' => $payload
            ]);
            
            $statusCode = $response->getStatusCode();
            $responseData = json_decode($response->getBody()->getContents(), true);
            
            // Enregistrer la réponse pour le débogage
            Log::info('SerdiPay payment request', [
                'status_code' => $statusCode,
                'response' => $responseData,
                'phone' => $phoneNumber,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'payment_type' => $paymentType
            ]);
            
            // Créer une transaction dans la base de données
            if ($statusCode === 200 && isset($responseData['payment']['sessionId'])) {
                $transactionData = [
                    'user_id' => $userId,
                    'wallet_id' => $walletId,
                    'email' => $email,
                    'phone_number' => $phoneNumber,
                    'payment_method' => $paymentMethod,
                    'payment_type' => $paymentType,
                    'amount' => $amount,
                    'currency' => $currency,
                    'session_id' => $responseData['sessionId'],
                    'reference' => $reference,
                    'type' => 'payment',
                    'direction' => 'client_to_merchant',
                    'status' => 'pending',
                    'purpose' => $purpose,
                    'request_data' => $payload,
                    'response_data' => $responseData
                ];
                
                // Ajouter les données de carte si c'est un paiement par carte
                if ($paymentType === 'card' && $cardData) {
                    $transactionData['card_number'] = $this->maskCardNumber($cardData['cardNumber'] ?? '');
                    $transactionData['card_holder_name'] = $cardData['cardHolder'] ?? null;
                    $transactionData['card_expiry'] = $cardData['expiryDate'] ?? null;
                    $transactionData['card_type'] = $paymentMethod; // MC ou VISA
                }
                
                SerdiPayTransaction::create($transactionData);
            }
            
            if ($statusCode === 200) {
                return [
                    'success' => true,
                    'message' => 'Paiement initié avec succès',
                    'data' => $responseData,
                    'session_id' => $responseData['payment']['sessionId'] ?? null,
                    'transaction_id' => $responseData['payment']['transactionId'] ?? null,
                ];
            } elseif ($statusCode === 102) {
                return [
                    'success' => true,
                    'message' => 'Paiement en cours de traitement',
                    'data' => $responseData,
                    'session_id' => $responseData['payment']['sessionId'] ?? null,
                    'status' => 'pending'
                ];
            } else {
                $errorMessage = $responseData['message'] ?? 'Erreur inconnue';
                Log::error('Erreur lors de l\'initiation du paiement: ' . $errorMessage);
                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'code' => 'payment_failed',
                    'status_code' => $statusCode,
                    'data' => $responseData
                ];
            }
            
        } catch (RequestException $e) {
            // Gestion spécifique des erreurs de requête Guzzle pour les paiements
            $responseBody = null;
            $responseHeaders = null;
            
            if ($e->hasResponse()) {
                $responseBody = $e->getResponse()->getBody()->getContents();
                $responseHeaders = $e->getResponse()->getHeaders();
            }
            
            Log::error('SerdiPay payment request exception', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'request_uri' => $e->getRequest()->getUri()->__toString(),
                'request_headers' => $e->getRequest()->getHeaders(),
                'response_body' => $responseBody,
                'response_headers' => $responseHeaders,
                'server_info' => [
                    'ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
                    'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
                ],
            ]);
            return [
                'success' => false,
                'message' => 'Erreur de communication avec SerdiPay: ' . $e->getMessage(),
                'code' => 'network_error'
            ];
        } catch (GuzzleException $e) {
            // Gestion des autres exceptions Guzzle pour les paiements
            Log::error('SerdiPay payment Guzzle exception', [
                'message' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement: ' . $e->getMessage(),
                'code' => 'guzzle_error'
            ];
        } catch (\Exception $e) {
            Log::error('SerdiPay payment exception', [
                'message' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement',
                'code' => 'system_error'
            ];
        }
    }
    
    
    /**
     * Traite les callbacks de SerdiPay
     *
     * @param array $callbackData Données du callback
     * @return array Résultat du traitement
     */
    public function handleCallback($callbackData)
    {
        try {
            Log::info('SerdiPay callback processing', $callbackData);
            
            $status = $callbackData['status'] ?? null;
            $message = $callbackData['message'] ?? null;
            $sessionId = $callbackData['payment']['sessionId'] ?? null;
            $paymentStatus = $callbackData['payment']['status'] ?? null;
            $transactionId = $callbackData['payment']['transactionId'] ?? null;
            
            if (!$sessionId) {
                return [
                    'status' => 'error',
                    'message' => 'Identifiant de session manquant dans le callback'
                ];
            }
            
            // Rechercher la transaction dans la base de données
            $transaction = SerdiPayTransaction::where('session_id', $sessionId)->first();
            
            if (!$transaction) {
                return [
                    'status' => 'error',
                    'message' => 'Transaction non trouvée pour la session ' . $sessionId
                ];
            }
            
            // Mettre à jour la transaction avec les informations du callback
            $transaction->status = $paymentStatus;
            if ($transactionId) {
                $transaction->transaction_id = $transactionId;
            }
            $transaction->callback_data = $callbackData;
            $transaction->callback_received_at = now();
            $transaction->save();
            
            return [
                'status' => 'success',
                'message' => 'Callback traité avec succès',
                'payment_status' => $paymentStatus,
                'transaction_id' => $transactionId,
                'session_id' => $sessionId,
                'type' => $transaction->type
            ];
            
        } catch (\Exception $e) {
            Log::error('SerdiPay callback processing exception', [
                'message' => $e->getMessage(),
                'callback_data' => $callbackData ?? null
            ]);
            
            return [
                'status' => 'error',
                'message' => 'Erreur lors du traitement du callback: ' . $e->getMessage(),
                'code' => 'callback_processing_error'
            ];
        }
    }
    
    /**
     * Valide un numéro de téléphone
     * 
     * @param string $phoneNumber Le numéro à valider
     * @return bool True si valide, false sinon
     */
    protected function validatePhoneNumber($phoneNumber)
    {
        // Format attendu : 243 suivi de 9 chiffres (ex: 243990624685)
        return preg_match('/^243\d{9}$/', $phoneNumber);
    }
    
    /**
     * Valide la méthode de paiement
     * 
     * @param string $paymentMethod Code de méthode de paiement
     * @return bool Vrai si le code est valide
     */
    private function validatePaymentMethod($paymentMethod)
    {
        $validMethods = ['MP', 'OM', 'AM', 'AF', 'MC', 'VISA', 'AE']; // Mobile money + cartes bancaires
        return in_array(strtoupper($paymentMethod), $validMethods);
    }
    
    /**
     * Détermine le type de paiement en fonction de la méthode
     * 
     * @param string $paymentMethod Code de méthode de paiement
     * @return string 'mobile_money' ou 'card'
     */
    private function determinePaymentType($paymentMethod)
    {
        $mobileMoneyMethods = ['MP', 'OM', 'AM', 'AF'];
        $cardMethods = ['MC', 'VISA', 'AE'];
        
        $paymentMethod = strtoupper($paymentMethod);
        
        if (in_array($paymentMethod, $mobileMoneyMethods)) {
            return 'mobile_money';
        } elseif (in_array($paymentMethod, $cardMethods)) {
            return 'card';
        }
        
        // Par défaut, considérer comme mobile money
        return 'mobile_money';
    }
    
    /**
     * Valide les données de carte bancaire
     * 
     * @param array|null $cardData Données de la carte
     * @return bool Vrai si les données sont valides
     */
    private function validateCardData($cardData)
    {
        if (!is_array($cardData)) {
            return false;
        }
        
        // Vérifier la présence des champs obligatoires
        $requiredFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'];
        foreach ($requiredFields as $field) {
            if (!isset($cardData[$field]) || empty($cardData[$field])) {
                return false;
            }
        }
        
        // Validation basique du numéro de carte (doit contenir uniquement des chiffres et tirets/espaces)
        if (!preg_match('/^[0-9\s-]+$/', $cardData['cardNumber'])) {
            return false;
        }
        
        // Validation basique de la date d'expiration (format MM/YY ou MM-YY)
        if (!preg_match('/^(0[1-9]|1[0-2])[\/\-]([0-9]{2})$/', $cardData['expiryDate'])) {
            return false;
        }
        
        // Validation basique du CVV (3 ou 4 chiffres)
        if (!preg_match('/^[0-9]{3,4}$/', $cardData['cvv'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Masque le numéro de carte pour le stockage sécurisé
     * 
     * @param string $cardNumber Numéro de carte complet
     * @return string Numéro de carte masqué (ex: XXXX-XXXX-XXXX-1234)
     */
    private function maskCardNumber($cardNumber)
    {
        // Supprimer les espaces et tirets
        $cardNumber = preg_replace('/[\s-]/', '', $cardNumber);
        
        // Garder uniquement les 4 derniers chiffres
        $length = strlen($cardNumber);
        if ($length <= 4) {
            return $cardNumber;
        }
        
        $maskedPart = str_repeat('X', $length - 4);
        $lastFour = substr($cardNumber, -4);
        
        // Reformater avec des tirets pour la lisibilité
        $maskedNumber = $maskedPart . $lastFour;
        if ($length === 16) { // Format standard pour la plupart des cartes
            return substr($maskedNumber, 0, 4) . '-' . substr($maskedNumber, 4, 4) . '-' . 
                   substr($maskedNumber, 8, 4) . '-' . substr($maskedNumber, 12, 4);
        }
        
        return $maskedNumber;
    }
    
    /**
     * Initie un retrait via SerdiPay (merchant to client)
     * 
     * @param string $phoneNumber Numéro de téléphone du client
     * @param float $amount Montant à payer
     * @param string $currency Devise (XAF, USD, etc.)
     * @param string $paymentMethod Méthode de paiement (MP, OM, AM, AF)
     * @param int|null $userId ID de l'utilisateur (optionnel)
     * @param int|null $walletId ID du portefeuille (optionnel)
     * @param string|null $email Email de l'utilisateur (optionnel)
     * @param string|null $purpose But du retrait (optionnel, ex: 'commission_withdrawal')
     * @param string|null $reference Référence optionnelle pour le paiement
     * @return array Résultat de la requête avec statut et message
     */
    public function initiateWithdrawal($phoneNumber, $amount, $currency, $paymentMethod, $userId = null, $walletId = null, $email = null, $purpose = null, $reference = null, $cardDetails = null)
    {
        $token = $this->getAuthToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement',
                'code' => 'auth_failed'
            ];
        }
        
        // Valider le numéro de téléphone
        if (!$this->validatePhoneNumber($phoneNumber)) {
            return [
                'success' => false,
                'message' => 'Numéro de téléphone invalide',
                'code' => 'invalid_phone'
            ];
        }
        
        // Valider la méthode de paiement
        if (!$this->validatePaymentMethod($paymentMethod)) {
            return [
                'success' => false,
                'message' => 'Méthode de paiement non prise en charge',
                'code' => 'invalid_payment_method'
            ];
        }
        
        // Pour les retraits, seul le mobile money est supporté pour l'instant
        if ($this->determinePaymentType($paymentMethod) !== 'mobile_money') {
            return [
                'success' => false,
                'message' => 'Les retraits ne sont supportés que pour le mobile money',
                'code' => 'unsupported_payment_type'
            ];
        }
        
        try {
            // Préparer les données pour le retrait (merchant to client)
            $payload = [
                'api_id' => $this->apiId,
                'api_password' => $this->apiPassword,
                'merchantCode' => $this->merchantCode,
                'merchant_pin' => $this->merchantPin,
                'clientPhone' => $phoneNumber,
                'amount' => (float) $amount,
                'currency' => $currency,
                'telecom' => strtoupper($paymentMethod) // L'API SerdiPay utilise toujours 'telecom' pour le mobile money
            ];
            
            // Ajouter la référence si fournie
            if ($reference) {
                $payload['reference'] = $reference;
            }
            
            // Utiliser l'endpoint merchant-payment pour les retraits (merchant to client)
            $response = $this->client->request('POST', $this->baseUrl . '/merchant/payment-client', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token
                ],
                'json' => $payload
            ]);
            
            $statusCode = $response->getStatusCode();
            $responseData = json_decode($response->getBody()->getContents(), true);
            
            // Enregistrer la réponse pour le débogage
            Log::info('SerdiPay withdrawal request', [
                'status_code' => $statusCode,
                'response' => $responseData,
                'phone' => $phoneNumber,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'payment_type' => 'mobile_money'
            ]);
            
            // Créer une transaction dans la base de données
            if ($statusCode === 200 && isset($responseData['sessionId'])) {
                SerdiPayTransaction::create([
                    'user_id' => $userId,
                    'wallet_id' => $walletId,
                    'email' => $email,
                    'phone_number' => $phoneNumber,
                    'payment_method' => $paymentMethod,
                    'payment_type' => 'mobile_money',
                    'amount' => $amount,
                    'currency' => $currency,
                    'session_id' => $responseData['sessionId'],
                    'reference' => $reference,
                    'type' => 'withdrawal',
                    'direction' => 'merchant_to_client',
                    'status' => 'pending',
                    'purpose' => $purpose,
                    'request_data' => $payload,
                    'response_data' => $responseData
                ]);
            }
            
            if ($statusCode === 200) {
                return [
                    'success' => true,
                    'message' => 'Retrait initié avec succès',
                    'code' => 'withdrawal_initiated',
                    'session_id' => $responseData['sessionId'] ?? null,
                    'data' => $responseData
                ];
            } else if ($statusCode === 102) {
                return [
                    'success' => true,
                    'message' => 'Retrait en cours de traitement',
                    'code' => 'withdrawal_processing',
                    'session_id' => $responseData['sessionId'] ?? null,
                    'data' => $responseData
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $responseData['message'] ?? 'Erreur lors du retrait',
                    'code' => 'withdrawal_failed',
                    'data' => $responseData
                ];
            }
            
        } catch (RequestException $e) {
            // Gestion spécifique des erreurs de requête Guzzle pour les retraits
            Log::error('SerdiPay withdrawal request exception', [
                'message' => $e->getMessage(),
                'request' => $e->getRequest(),
                'response' => $e->hasResponse() ? $e->getResponse() : null
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur de communication avec SerdiPay: ' . $e->getMessage(),
                'code' => 'network_error'
            ];
        } catch (GuzzleException $e) {
            // Gestion des autres exceptions Guzzle pour les retraits
            Log::error('SerdiPay withdrawal Guzzle exception', [
                'message' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors du traitement du retrait: ' . $e->getMessage(),
                'code' => 'guzzle_error'
            ];
        } catch (\Exception $e) {
            Log::error('SerdiPay withdrawal exception', [
                'message' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur système lors du retrait: ' . $e->getMessage(),
                'code' => 'system_error'
            ];
        }
    }
}