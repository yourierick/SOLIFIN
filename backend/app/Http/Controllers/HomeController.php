<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use App\Models\Publicite; // Correction du modèle
use App\Models\JobOffer;
use App\Models\BusinessOpportunity;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use App\Models\Setting;

class HomeController extends Controller
{
    /**
     * Retourner les publicités approuvées (pour le carrousel)
     */
    public function approvedAds()
    {
        try {
            $ads = Publicite::where('statut', 'approuvé')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function($ad) {
                    // Générer les URLs complètes pour image/vidéo si besoin
                    $ad->image_url = $ad->image ? asset('storage/' . $ad->image) : null;
                    $ad->video_url = $ad->video ? asset('storage/' . $ad->video) : null;
                    return $ad;
                });
            return response()->json([
                'success' => true,
                'ads' => $ads
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des publicités',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function index()
    {
        try {
            $packs = Pack::where('status', true)->get();
            
            return response()->json([
                'success' => true,
                'data' => $packs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSettings()
    {
        try {
            // Liste des clés de paramètres publics à récupérer
            $publicKeys = [
                // Réseaux sociaux
                'facebook_url',
                'twitter_url',
                'instagram_url',
                'linkedin_url',
                'whatsapp_url',
                
                // Photo du fondateur
                'founder_photo',
                
                // Documents légaux
                'terms_of_use',
                'privacy_policy',
                'legal_notice',
                'cookies_policy'
            ];
            
            // Récupérer uniquement les paramètres publics
            $settings = Setting::whereIn('key', $publicKeys)->get();
            
            // Organiser les paramètres par catégorie
            $organizedSettings = [
                'social' => [],
                'founder' => [],
                'legal' => []
            ];
            
            foreach ($settings as $setting) {
                // Traitement des URLs pour les images
                if ($setting->key == 'founder_photo' && $setting->value) {
                    // Vérifier si l'URL est déjà complète
                    if (!str_starts_with($setting->value, 'http')) {
                        $setting->value = asset('storage/' . $setting->value);
                    }
                }
                
                // Catégoriser les paramètres
                if (in_array($setting->key, ['facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'whatsapp_url'])) {
                    $organizedSettings['social'][$setting->key] = $setting->value;
                } elseif ($setting->key == 'founder_photo') {
                    $organizedSettings['founder'][$setting->key] = $setting->value;
                } elseif (in_array($setting->key, ['terms_of_use', 'privacy_policy', 'legal_notice', 'cookies_policy'])) {
                    // Pour les documents légaux, on structure avec plus d'informations
                    $title = '';
                    switch ($setting->key) {
                        case 'terms_of_use':
                            $title = 'Conditions d\'utilisation';
                            break;
                        case 'privacy_policy':
                            $title = 'Politique de confidentialité';
                            break;
                        case 'legal_notice':
                            $title = 'Mentions légales';
                            break;
                        case 'cookies_policy':
                            $title = 'Politique de cookies';
                            break;
                        default:
                            $title = ucfirst(str_replace('_', ' ', $setting->key));
                    }
                    
                    $organizedSettings['legal'][$setting->key] = [
                        'title' => $title,
                        'content' => $setting->value,
                        'updated_at' => $setting->updated_at->format('Y-m-d')
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => $organizedSettings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paramètres',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
} 