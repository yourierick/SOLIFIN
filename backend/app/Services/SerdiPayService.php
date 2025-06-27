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
        $this->baseUrl = env('SERDIPAY_BASE_URL', 'https://serdipay.com/api/public-api/v1');
        $this->apiId = env('SERDIPAY_API_ID');
        $this->apiPassword = env('SERDIPAY_API_PASSWORD');
        $this->merchantCode = env('SERDIPAY_MERCHANT_CODE');
        $this->merchantPin = env('SERDIPAY_MERCHANT_PIN');
        
        // Initialiser le client Guzzle avec des options par défaut
        $this->client = new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'http_errors' => false, // Ne pas lancer d'exception pour les codes d'état HTTP
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
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
        // Vérifier si un token en cache existe et est valide
        if (Cache::has($this->tokenCacheKey)) {
            return Cache::get($this->tokenCacheKey);
        }
        
        try {
            $response = $this->client->request('POST', $this->baseUrl . '/merchant/get-token', [
                'json' => [
                    'email' => env('SERDIPAY_EMAIL'),
                    'password' => env('SERDIPAY_PASSWORD'),
                ]
            ]);
            
            $statusCode = $response->getStatusCode();
            $data = json_decode($response->getBody()->getContents(), true);
            
            if ($statusCode === 200) {
                if (isset($data['access_token'])) {
                    // Stocker le token en cache pendant 23 heures (pour éviter les problèmes d'expiration)
                    Cache::put($this->tokenCacheKey, $data['access_token'], 60 * 60 * 23);
                    return $data['access_token'];
                }
            }
            
            Log::error('SerdiPay authentication failed', [
                'status' => $statusCode,
                'response' => $data,
            ]);
            
            return null;
        } catch (RequestException $e) {
            // Gestion spécifique des erreurs de requête Guzzle
            Log::error('SerdiPay request exception', [
                'message' => $e->getMessage(),
                'request' => $e->getRequest(),
                'response' => $e->hasResponse() ? $e->getResponse() : null
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
     * @param string $telecom Opérateur télécom (MP, OM, AM, AF)
     * @param int|null $userId ID de l'utilisateur (optionnel)
     * @param int|null $walletId ID du portefeuille (optionnel)
     * @param string|null $email Email de l'utilisateur (optionnel)
     * @param string|null $purpose But du paiement (optionnel, ex: 'pack_purchase')
     * @param string|null $reference Référence optionnelle pour le paiement
     * @return array Résultat de la requête avec statut et message
     */
    public function initiatePayment($phoneNumber, $amount, $currency, $telecom, $userId = null, $walletId = null, $email = null, $purpose = null, $reference = null)
    {
        $token = $this->getAuthToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Échec d\'authentification avec SerdiPay',
                'code' => 'auth_failed'
            ];
        }
        
        // Valider les données d'entrée
        if (!$this->validatePhoneNumber($phoneNumber)) {
            return [
                'success' => false,
                'message' => 'Numéro de téléphone invalide',
                'code' => 'invalid_phone'
            ];
        }
        
        if (!$this->validateTelecom($telecom)) {
            return [
                'success' => false,
                'message' => 'Opérateur télécom non supporté',
                'code' => 'invalid_telecom'
            ];
        }
        
        try {
            $payload = [
                'api_id' => $this->apiId,
                'api_password' => $this->apiPassword,
                'merchantCode' => $this->merchantCode,
                'merchant_pin' => $this->merchantPin,
                'clientPhone' => $phoneNumber,
                'amount' => (float) $amount,
                'currency' => $currency,
                'telecom' => $telecom,
            ];
            
            // Ajouter une référence si fournie
            if ($reference) {
                $payload['reference'] = $reference;
            }
            
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
                'telecom' => $telecom
            ]);
            
            // Créer une transaction dans la base de données
            if ($statusCode === 200 && isset($responseData['sessionId'])) {
                SerdiPayTransaction::create([
                    'user_id' => $userId,
                    'wallet_id' => $walletId,
                    'email' => $email,
                    'phone_number' => $phoneNumber,
                    'telecom' => $telecom,
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
                ]);
                
                // Si un wallet est spécifié, créer aussi une entrée dans WalletTransaction
                if ($walletId) {
                    WalletTransaction::create([
                        'wallet_id' => $walletId,
                        'amount' => $amount,
                        'type' => 'purchase',
                        'status' => 'pending',
                        'metadata' => [
                            'payment_method' => 'serdipay',
                            'session_id' => $responseData['sessionId'],
                            'phone_number' => $phoneNumber,
                            'telecom' => $telecom,
                            'currency' => $currency,
                            'reference' => $reference
                        ]
                    ]);
                }
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
            Log::error('SerdiPay payment request exception', [
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
                'message' => 'Erreur lors du traitement du paiement: ' . $e->getMessage(),
                'code' => 'system_error'
            ];
        }
    }
    
    /**
     * Vérifie le statut d'une transaction SerdiPay
     * 
     * @param string $sessionId L'ID de session fourni par SerdiPay
     * @return array Le statut de la transaction
     */
    public function checkTransactionStatus($sessionId)
    {
        $token = $this->getAuthToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Échec d\'authentification avec SerdiPay',
                'code' => 'auth_failed'
            ];
        }
        
        try {
            $response = $this->client->request('GET', $this->baseUrl . '/merchant/transaction/' . $sessionId, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token
                ]
            ]);
            
            $statusCode = $response->getStatusCode();
            $responseData = json_decode($response->getBody()->getContents(), true);
            
            if ($statusCode === 200) {
                $paymentStatus = $responseData['payment']['status'] ?? 'unknown';
                
                return [
                    'success' => true,
                    'status' => $paymentStatus,
                    'message' => $paymentStatus === 'success' ? 'Paiement réussi' : 'Paiement en attente ou échoué',
                    'data' => $responseData
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $responseData['message'] ?? 'Erreur lors de la vérification du statut',
                    'code' => 'status_check_failed',
                    'data' => $responseData
                ];
            }
            
        } catch (RequestException $e) {
            // Gestion spécifique des erreurs de requête Guzzle pour la vérification de statut
            Log::error('SerdiPay status check request exception', [
                'message' => $e->getMessage(),
                'session_id' => $sessionId,
                'request' => $e->getRequest(),
                'response' => $e->hasResponse() ? $e->getResponse() : null
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur de communication avec SerdiPay: ' . $e->getMessage(),
                'code' => 'network_error'
            ];
        } catch (GuzzleException $e) {
            // Gestion des autres exceptions Guzzle pour la vérification de statut
            Log::error('SerdiPay status check Guzzle exception', [
                'message' => $e->getMessage(),
                'session_id' => $sessionId
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de la vérification du statut: ' . $e->getMessage(),
                'code' => 'guzzle_error'
            ];
        } catch (\Exception $e) {
            Log::error('SerdiPay status check exception', [
                'message' => $e->getMessage(),
                'session_id' => $sessionId
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de la vérification du statut: ' . $e->getMessage(),
                'code' => 'system_error'
            ];
        }
    }
    
    /**
     * Traite les données de callback reçues de SerdiPay
     * 
     * @param array $callbackData Données reçues dans le callback
     * @return array Résultat du traitement avec statut et message
     */
    public function handleCallback($callbackData)
    {
        try {
            // Valider les données reçues
            if (!isset($callbackData['sessionId']) || !isset($callbackData['status'])) {
                Log::warning('SerdiPay callback missing required fields', [
                    'data' => $callbackData
                ]);
                
                return [
                    'success' => false,
                    'message' => 'Données de callback incomplètes',
                    'code' => 'invalid_callback_data'
                ];
            }
            
            $sessionId = $callbackData['sessionId'];
            $status = $callbackData['status'];
            $transactionId = $callbackData['transactionId'] ?? null;
            
            // Enregistrer le callback pour le débogage
            Log::info('SerdiPay callback received', [
                'session_id' => $sessionId,
                'status' => $status,
                'transaction_id' => $transactionId,
                'data' => $callbackData
            ]);
            
            // Mettre à jour la transaction SerdiPay dans la base de données
            $serdiTransaction = SerdiPayTransaction::where('session_id', $sessionId)->first();
            
            if ($serdiTransaction) {
                // Mettre à jour le statut de la transaction
                $newStatus = ($status === 'success') ? 'completed' : 'failed';
                
                $serdiTransaction->status = $newStatus;
                $serdiTransaction->transaction_id = $transactionId;
                $serdiTransaction->callback_data = $callbackData;
                $serdiTransaction->callback_received_at = now();
                $serdiTransaction->save();
                
                // Mettre à jour également la transaction wallet si elle existe
                $walletTransaction = WalletTransaction::where('metadata->session_id', $sessionId)->first();
                if ($walletTransaction) {
                    $metadata = $walletTransaction->metadata;
                    $metadata['transaction_id'] = $transactionId;
                    $metadata['callback_data'] = $callbackData;
                    $metadata['callback_time'] = now()->toDateTimeString();
                    
                    $walletTransaction->status = $newStatus;
                    $walletTransaction->metadata = $metadata;
                    $walletTransaction->save();
                    
                    // Si la transaction est réussie et qu'il s'agit d'un paiement, mettre à jour le solde du portefeuille
                    if ($status === 'success' && $serdiTransaction->wallet_id) {
                        $wallet = Wallet::find($serdiTransaction->wallet_id);
                        if ($wallet) {
                            // Selon le type de transaction, ajuster le solde
                            if ($serdiTransaction->type === 'withdrawal') {
                                // Pour un retrait, déduire du solde
                                $wallet->balance -= $serdiTransaction->amount;
                                $wallet->total_withdrawn += $serdiTransaction->amount;
                                $wallet->save();
                            }
                            // Pour un paiement (client to merchant), on ne modifie pas le solde car c'est un débit externe
                        }
                    }
                }
            } else {
                Log::warning('SerdiPay callback received for unknown transaction', [
                    'session_id' => $sessionId
                ]);
            }
            
            // Traiter selon le statut
            if ($status === 'success') {
                // Traitement pour une transaction réussie
                return [
                    'success' => true,
                    'message' => 'Paiement réussi',
                    'code' => 'payment_success',
                    'session_id' => $sessionId,
                    'transaction_id' => $transactionId,
                    'transaction_record' => $transaction,
                    'raw_data' => $callbackData
                ];
            } else {
                // Traitement pour une transaction échouée
                return [
                    'success' => false,
                    'message' => 'Paiement échoué',
                    'code' => 'payment_failed',
                    'session_id' => $sessionId,
                    'transaction_id' => $transactionId,
                    'transaction_record' => $transaction,
                    'raw_data' => $callbackData
                ];
            }
            
        } catch (\Exception $e) {
            Log::error('SerdiPay callback processing exception', [
                'message' => $e->getMessage(),
                'data' => $callbackData ?? null
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors du traitement du callback: ' . $e->getMessage(),
                'code' => 'system_error'
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
        // Format attendu pour les numéros de téléphone africains
        // Cette validation peut être adaptée selon les besoins spécifiques
        return preg_match('/^\d{9,15}$/', $phoneNumber);
    }
    
    /**
     * Valide le code opérateur télécom
     * 
     * @param string $telecom Code opérateur télécom
     * @return bool Vrai si le code est valide
     */
    private function validateTelecom($telecom)
    {
        $validTelecoms = ['MP', 'OM', 'AM', 'AF']; // Mpesa, Orange Money, Airtel Money, Afrimoney
        return in_array(strtoupper($telecom), $validTelecoms);
    }
    
    /**
     * Initie un retrait via SerdiPay (merchant to client)
     * 
     * @param string $phoneNumber Numéro de téléphone du client
     * @param float $amount Montant à payer
     * @param string $currency Devise (XAF, USD, etc.)
     * @param string $telecom Opérateur télécom (MP, OM, AM, AF)
     * @param int|null $userId ID de l'utilisateur (optionnel)
     * @param int|null $walletId ID du portefeuille (optionnel)
     * @param string|null $email Email de l'utilisateur (optionnel)
     * @param string|null $purpose But du retrait (optionnel, ex: 'commission_withdrawal')
     * @param string|null $reference Référence optionnelle pour le paiement
     * @return array Résultat de la requête avec statut et message
     */
    public function initiateWithdrawal($phoneNumber, $amount, $currency, $telecom, $userId = null, $walletId = null, $email = null, $purpose = null, $reference = null)
    {
        $token = $this->getAuthToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Échec d\'authentification avec SerdiPay',
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
        
        // Valider l'opérateur télécom
        if (!$this->validateTelecom($telecom)) {
            return [
                'success' => false,
                'message' => 'Opérateur télécom non pris en charge',
                'code' => 'invalid_telecom'
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
                'telecom' => strtoupper($telecom)
            ];
            
            // Ajouter la référence si fournie
            if ($reference) {
                $payload['reference'] = $reference;
            }
            
            // Utiliser l'endpoint merchant-payment pour les retraits (merchant to client)
            $response = $this->client->request('POST', $this->baseUrl . '/merchant/payment-merchant', [
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
                'telecom' => $telecom
            ]);
            
            // Créer une transaction dans la base de données
            if ($statusCode === 200 && isset($responseData['sessionId'])) {
                SerdiPayTransaction::create([
                    'user_id' => $userId,
                    'wallet_id' => $walletId,
                    'email' => $email,
                    'phone_number' => $phoneNumber,
                    'telecom' => $telecom,
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
                
                // Si un wallet est spécifié, créer aussi une entrée dans WalletTransaction
                if ($walletId) {
                    WalletTransaction::create([
                        'wallet_id' => $walletId,
                        'amount' => $amount,
                        'type' => 'withdrawal',
                        'status' => 'pending',
                        'metadata' => [
                            'payment_method' => 'serdipay',
                            'session_id' => $responseData['sessionId'],
                            'phone_number' => $phoneNumber,
                            'telecom' => $telecom,
                            'currency' => $currency,
                            'reference' => $reference
                        ]
                    ]);
                }
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