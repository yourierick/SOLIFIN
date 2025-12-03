<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialEvent;
use App\Models\SocialEventReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class SocialEventAdminController extends Controller
{
    /**
     * Compter le nombre de statuts sociaux en attente
     *
     * @return JsonResponse
     */
    public function pendingCount(): JsonResponse
    {
        try {
            $count = SocialEvent::where('statut', 'en_attente')->count();
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du comptage des statuts sociaux en attente', 'error' => $e->getMessage()], 500);
        }
    }
    /**
     * Afficher tous les statuts sociaux pour l'administration avec pagination.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Paramètres de pagination
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 10);
            
            // Construction de la requête
            $query = SocialEvent::with(['user', 'reports'])
                ->orderBy('created_at', 'desc');
            
            // Filtres
            if ($request->has('statut') && $request->get('statut') !== 'all') {
                $query->where('statut', $request->get('statut'));
            }
            
            if ($request->has('etat') && $request->get('etat') !== 'all') {
                $query->where('etat', $request->get('etat'));
            }
            
            // Pagination
            $socialEvents = $query->paginate($perPage, ['*'], 'page', $page);
            
            // Transformer les résultats
            $socialEvents->getCollection()->transform(function ($socialEvent) {
                if ($socialEvent->image) {  
                    $socialEvent->image_url = asset('storage/' . $socialEvent->image);
                }
                if ($socialEvent->video) {
                    $socialEvent->video_url = asset('storage/' . $socialEvent->video);
                }

                if ($socialEvent->user->picture) {
                    $socialEvent->user->picture_url = asset('storage/' . $socialEvent->user->picture);
                }
                
                // Ajouter le nombre de signalements
                $socialEvent->reports_count = $socialEvent->reports->count();
                
                // Regrouper les raisons de signalement pour une meilleure analyse
                $reasonCounts = [];
                foreach ($socialEvent->reports as $report) {
                    if (!isset($reasonCounts[$report->reason])) {
                        $reasonCounts[$report->reason] = 0;
                    }
                    $reasonCounts[$report->reason]++;
                }
                $socialEvent->report_reasons = $reasonCounts;
                
                // Déterminer si le statut nécessite une attention urgente (plus de 3 signalements)
                $socialEvent->needs_attention = $socialEvent->reports_count >= 3;
                
                return $socialEvent;
            });

            return response()->json([
                'socialEvents' => $socialEvents
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des statuts sociaux', 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Approuver un statut social.
     */
    public function approve($id)
    {
        $socialEvent = SocialEvent::findOrFail($id);
        $socialEvent->statut = 'approuvé';
        $socialEvent->created_at = now();
        $socialEvent->save();

        return response()->json(['message' => 'Statut social approuvé avec succès']);
    }

    /**
     * Rejeter un statut social.
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'raison_rejet' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        \Log::info($validator->fails());

        $socialEvent = SocialEvent::findOrFail($id);
        $socialEvent->statut = 'rejeté';
        $socialEvent->raison_rejet = $request->raison_rejet;
        $socialEvent->save();

        return response()->json(['message' => 'Statut social rejeté avec succès']);
    }

    /**
     * Mettre à jour le statut d'un statut social.
     */
    public function updateStatus(Request $request, $id)
    {
        $socialEvent = SocialEvent::findOrFail($id);
        $socialEvent->statut = 'en_attente';
        $socialEvent->save();
        
        return response()->json(['message' => 'Statut social mis en attente avec succès']);
    }

    /**
     * Supprimer un statut social.
     */
    public function destroy($id)
    {
        $socialEvent = SocialEvent::findOrFail($id);

        // Supprimer les fichiers associés
        if ($socialEvent->image) {
            Storage::disk('public')->delete($socialEvent->image);
        }
        
        if ($socialEvent->video) {
            Storage::disk('public')->delete($socialEvent->video);
        }

        $socialEvent->delete();

        return response()->json(['message' => 'Statut social supprimé avec succès']);
    }
}
