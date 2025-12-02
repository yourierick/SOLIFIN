<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\SerdiPayTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Les clés de paramètres autorisées
     */
    protected $allowedKeys = [
        // Paramètres financiers
        'withdrawal_commission',
        'boost_price',
        'withdrawal_fee_percentage',
        'sending_fee_percentage',
        'transfer_fee_percentage',
        'transfer_commission',
        'purchase_fee_percentage',
        'purchase_commission_system',
        
        // Configuration des devises
        'dual_currency',
        
        // Réseaux sociaux
        'facebook_url',
        'whatsapp_url',
        'twitter_url',
        'instagram_url',
        
        // Documents légaux
        'terms_of_use',
        'privacy_policy',
        
        // Photo du fondateur
        'founder_photo',

        // Durée d'expiration des jetons Esengo
        'jeton_expiration_months',

        // Durée d'expiration des tickets gagnants
        'ticket_expiration_months',

        // Durée de l'essai
        'essai_duration_days',
    ];

    /**
     * Récupère un paramètre par sa clé.
     *
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByKey($key)
    {
        if (!in_array($key, $this->allowedKeys)) {
            return response()->json([
                'success' => false,
                'message' => 'Clé de paramètre non autorisée.'
            ], 400);
        }

        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètre non trouvé.'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'setting' => $setting
        ]);
    }

    /**
     * Met à jour un paramètre existant par sa clé ou le crée s'il n'existe pas.
     *
     * @param \Illuminate\Http\Request $request
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateByKey(Request $request, $key)
    {
        // Vérifier que la clé est autorisée
        if (!in_array($key, $this->allowedKeys)) {
            return response()->json([
                'success' => false,
                'message' => 'Clé de paramètre non autorisée.'
            ], 400);
        }

        // Validation des données
        $validator = Validator::make($request->all(), [
            'value' => 'required|string',
            'description' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Validation spécifique selon la clé
        if (in_array($key, [
            'withdrawal_commission', 
            'withdrawal_fee_percentage', 
            'sending_fee_percentage', 
            'transfer_commission',
            'transfer_fee_percentage',
            'purchase_fee_percentage',
            'purchase_commission_system',
            'essai_duration_days',
        ])) {
            $value = floatval($request->value);
            if ($value < 0 || $value > 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'La valeur doit être un nombre entre 0 et 100.'
                ], 400);
            }
        } elseif ($key === 'boost_price') {
            $value = floatval($request->value);
            if ($value <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'La valeur doit être un nombre positif.'
                ], 400);
            }
        }

        // Recherche du paramètre
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            // Si le paramètre n'existe pas, on le crée
            $setting = Setting::create([
                'key' => $key,
                'value' => $request->value,
                'description' => $request->description
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Paramètre créé avec succès.',
                'setting' => $setting
            ], 201);
        }

        // Mise à jour du paramètre existant
        $setting->value = $request->value;
        $setting->description = $request->description;
        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Paramètre mis à jour avec succès.',
            'setting' => $setting
        ]);
    }

    /**
     * Télécharge une image pour un paramètre spécifique.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $key
     * @return \Illuminate\Http\Response
     */
    public function uploadImage(Request $request, $key)
    {
        // Vérifier si la clé est autorisée
        if (!in_array($key, $this->allowedKeys)) {
            return response()->json(['success' => false, 'message' => 'Clé de paramètre non autorisée.'], 400);
        }

        // Valider la requête
        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,jpg,png|max:2048', // Max 2MB
            'description' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            // Traiter le fichier
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = $key . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                // Stocker le fichier dans le disque public
                $path = 'uploads/settings';
                $fileUrl = $file->store($path, 'public');
                
                // Créer l'URL relative pour accéder à l'image
                if (!$fileUrl) {
                    throw new \Exception('Erreur lors de l\'enregistrement du fichier');
                }
                
                // Mettre à jour ou créer le paramètre
                $setting = Setting::where('key', $key)->first();
                
                if (!$setting) {
                    $setting = Setting::create([
                        'key' => $key,
                        'value' => $fileUrl,
                        'description' => $request->description
                    ]);
                    return response()->json([
                        'success' => true, 
                        'message' => 'Image téléchargée et paramètre créé avec succès.', 
                        'setting' => $setting
                    ], 201);
                }
                
                // Supprimer l'ancienne image si elle existe
                $oldImagePath = $setting->value;
                if ($oldImagePath && !str_starts_with($oldImagePath, 'http')) {
                    // Si c'est un chemin stocké dans le disque public
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($oldImagePath)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($oldImagePath);
                    }
                }
                
                $setting->value = $fileUrl;
                $setting->description = $request->description;
                $setting->save();
                
                return response()->json([
                    'success' => true, 
                    'message' => 'Image téléchargée et paramètre mis à jour avec succès.', 
                    'setting' => $setting
                ]);
            }
            
            return response()->json(['success' => false, 'message' => 'Aucun fichier trouvé.'], 400);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors du téléchargement: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Récupère tous les paramètres.
     * 
     * Conservé pour compatibilité avec le frontend.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $settings = Setting::all();
        foreach ($settings as $setting) {
            if ($setting->key == 'founder_photo' && $setting->value) {
                // Vérifier si l'URL est déjà complète
                if (!str_starts_with($setting->value, 'http')) {
                    $setting->value = asset("storage/" . $setting->value);
                }
            }
        }
        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }
    
    /**
     * Récupère les transactions Serdipay avec pagination, filtres et statistiques
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSerdipayTransactions(Request $request)
    {
        try {
            // Récupérer les paramètres de requête
            $perPage = $request->input('per_page', 10);
            $search = $request->input('search');
            $status = $request->input('status');
            $payment_method = $request->input('payment_method');
            $type = $request->input('type');
            $payment_type = $request->input('payment_type');
            $direction = $request->input('direction');
            $date_from = $request->input('date_from');
            $date_to = $request->input('date_to');
            $currency = $request->input('currency'); // Ajout du filtre currency
            $stats_only = $request->input('stats_only', false);
            $include_stats = $request->input('include_stats', true);
            
            // Debug: afficher les paramètres reçus
            \Log::info('Paramètres reçus:', [
                'search' => $search,
                'date_from' => $date_from,
                'date_to' => $date_to,
                'status' => $status,
                'payment_method' => $payment_method,
                'type' => $type
            ]);
            
            // Construire la requête de base
            $query = SerdiPayTransaction::query();
            
            // Appliquer les filtres
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhere('reference', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
            
            if ($status) {
                $query->where('status', $status);
            }
            
            if ($payment_method) {
                $query->where('payment_method', $payment_method);
            }
            
            if ($type) {
                $query->where('type', $type);
            }
            
            if ($payment_type) {
                $query->where('payment_type', $payment_type);
            }
            
            if ($direction) {
                $query->where('direction', $direction);
            }
            
            if ($date_from) {
                $query->whereDate('created_at', '>=', $date_from);
            }
            
            if ($date_to) {
                $query->whereDate('created_at', '<=', $date_to);
            }
            
            if ($currency) {
                $query->where('currency', strtoupper($currency));
            }
            
            // Préparer la réponse
            $response = ['success' => true];
            
            // Si on ne demande que les statistiques, on ne charge pas les transactions
            if (!$stats_only) {
                // Ajouter les relations seulement si nécessaire pour la pagination
                $query->with(['user', 'wallet'])->orderBy('created_at', 'desc');
                $response['transactions'] = $query->paginate($perPage);
            }
            
            // Calculer les statistiques si demandé
            if ($include_stats) {
                // Utiliser des requêtes optimisées avec cache pour les statistiques
                $cacheTime = 60; // Cache de 60 minutes pour les statistiques
                $cacheKey = 'serdipay_stats_' . md5(json_encode($request->all()));
                
                $stats = \Illuminate\Support\Facades\Cache::remember($cacheKey, $cacheTime, function () use ($date_from, $date_to) {
                    // Requête optimisée pour les comptages et sommes
                    $baseQuery = SerdiPayTransaction::query();
                    
                    // Appliquer les filtres de date aux statistiques si spécifiés
                    if ($date_from) {
                        $baseQuery->whereDate('created_at', '>=', $date_from);
                    }
                    
                    if ($date_to) {
                        $baseQuery->whereDate('created_at', '<=', $date_to);
                    }
                    
                    // Utiliser une seule requête pour les comptages par statut
                    $statusCounts = $baseQuery->selectRaw('status, COUNT(*) as count, SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as total_amount')
                        ->groupBy('status')
                        ->get()
                        ->keyBy('status');
                    
                    // Requête optimisée pour les statistiques par méthode de paiement
                    $paymentMethodStats = SerdiPayTransaction::selectRaw('payment_method, COUNT(*) as count')
                        ->groupBy('payment_method')
                        ->get();
                    
                    // Requête optimisée pour les statistiques mensuelles
                    $monthlyStats = SerdiPayTransaction::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count, SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as amount')
                        ->groupBy('month')
                        ->orderBy('month')
                        ->get();
                    
                    // Calculer les totaux à partir des résultats
                    $totalTransactions = $statusCounts->sum('count');
                    $totalAmount = $statusCounts->sum('total_amount');
                    $successfulTransactions = $statusCounts->get('completed')['count'] ?? 0;
                    $failedTransactions = $statusCounts->get('failed')['count'] ?? 0;
                    $pendingTransactions = $statusCounts->get('pending')['count'] ?? 0;
                    
                    return [
                        'totalTransactions' => $totalTransactions,
                        'totalAmount' => $totalAmount,
                        'successfulTransactions' => $successfulTransactions,
                        'failedTransactions' => $failedTransactions,
                        'pendingTransactions' => $pendingTransactions,
                        'paymentMethodStats' => $paymentMethodStats,
                        'monthlyStats' => $monthlyStats
                    ];
                });
                
                $response['stats'] = $stats;
            }
            
            return response()->json($response);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupère une transaction Serdipay spécifique avec tous ses détails
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSerdipayTransaction($id)
    {
        try {
            $transaction = SerdiPayTransaction::with(['user', 'wallet'])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'transaction' => $transaction
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la transaction: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Exporte les transactions Serdipay au format CSV ou Excel
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function exportSerdipayTransactions(Request $request)
    {
        try {
            // Récupérer les paramètres de requête
            $format = $request->input('format', 'csv');
            $search = $request->input('search');
            $status = $request->input('status');
            $payment_method = $request->input('payment_method');
            $type = $request->input('type');
            $payment_type = $request->input('payment_type');
            $direction = $request->input('direction');
            $date_from = $request->input('date_from');
            $date_to = $request->input('date_to');
            $currency = $request->input('currency'); // Ajout du filtre currency
            
            // Construire la requête de base
            $query = SerdiPayTransaction::with('user');
            
            // Appliquer les filtres
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhere('reference', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
            
            if ($status) {
                $query->where('status', $status);
            }
            
            if ($payment_method) {
                $query->where('payment_method', $payment_method);
            }
            
            if ($type) {
                $query->where('type', $type);
            }
            
            if ($payment_type) {
                $query->where('payment_type', $payment_type);
            }
            
            if ($direction) {
                $query->where('direction', $direction);
            }
            
            if ($date_from) {
                $query->whereDate('created_at', '>=', $date_from);
            }
            
            if ($date_to) {
                $query->whereDate('created_at', '<=', $date_to);
            }
            
            if ($currency) {
                $query->where('currency', strtoupper($currency));
            }
            
            // Récupérer les transactions
            $transactions = $query->orderBy('created_at', 'desc')->get();
            
            // Définir les en-têtes
            $headers = [
                'ID', 'Référence', 'Utilisateur', 'Email', 'Téléphone', 
                'Montant', 'Devise', 'Méthode de paiement', 'Type', 'Type de paiement',
                'Direction', 'Statut', 'Date de création', 'Date de mise à jour'
            ];
            
            // Préparer les données
            $data = [];
            foreach ($transactions as $transaction) {
                $data[] = [
                    $transaction->id,
                    $transaction->reference ?? 'Non défini',
                    $transaction->user ? $transaction->user->name : 'Non défini',
                    $transaction->email ?? 'Non défini',
                    $transaction->phone_number ?? 'Non défini',
                    number_format($transaction->amount, 2, '.', ','),
                    strtoupper($transaction->currency ?? 'USD'),
                    $this->getPaymentMethodName($transaction->payment_method),
                    $this->getTransactionTypeName($transaction->type),
                    $transaction->payment_type ?? 'Non défini',
                    $transaction->direction ?? 'Non défini',
                    $this->getTransactionStatusName($transaction->status),
                    \Carbon\Carbon::parse($transaction->created_at)->format('d/m/Y H:i:s'),
                    \Carbon\Carbon::parse($transaction->updated_at)->format('d/m/Y H:i:s')
                ];
            }
            
            // Générer le fichier CSV lisible par Excel
            $filename = 'serdipay_transactions_' . date('Y-m-d_H-i-s') . '.csv';
            
            $callback = function() use ($data, $headers) {
                $file = fopen('php://output', 'w');
                
                // Ajouter BOM UTF-8 pour Excel
                fwrite($file, "\xEF\xBB\xBF");
                
                // Écrire les en-têtes avec point-virgule (standard Excel français)
                fputcsv($file, $headers, ';');
                
                // Écrire les données avec point-virgule
                foreach ($data as $row) {
                    fputcsv($file, $row, ';');
                }
                
                fclose($file);
            };
            
            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
                'Expires' => '0',
                'Pragma' => 'public'
            ];
            
            return response()->stream($callback, 200, $headers);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des transactions: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Formate le nom de la méthode de paiement
     */
    private function getPaymentMethodName($method)
    {
        $methods = [
            'OM' => 'Orange Money',
            'AM' => 'Airtel Money',
            'MC' => 'Mastercard',
            'VISA' => 'Visa',
            'AE' => 'American Express',
            'MP' => 'M-Pesa',
            'AF' => 'Afrimoney'
        ];
        
        return $methods[$method] ?? $method ?? 'Non défini';
    }
    
    /**
     * Formate le nom du type de transaction
     */
    private function getTransactionTypeName($type)
    {
        $types = [
            'payment' => 'Paiement',
            'withdrawal' => 'Retrait'
        ];
        
        return $types[$type] ?? $type ?? 'Non défini';
    }
    
    /**
     * Formate le nom du statut de transaction
     */
    private function getTransactionStatusName($status)
    {
        $statuses = [
            'completed' => 'Complétée',
            'pending' => 'En attente',
            'failed' => 'Échouée',
            'expired' => 'Expirée'
        ];
        
        return $statuses[$status] ?? $status ?? 'Non défini';
    }
}
