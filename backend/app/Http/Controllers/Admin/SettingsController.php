<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
}
