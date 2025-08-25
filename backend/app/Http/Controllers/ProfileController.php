<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $user->profile_picture_url = $user->getProfilePictureUrlAttribute();
        $packs = $user->packs;
        
        // Récupérer les deux dernières sessions de l'utilisateur
        $session = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->first();
            
        $user->last_ip_address = $session ? $session->ip_address : null;
        
        // Extraire des informations plus lisibles du user-agent
        if ($session && $session->user_agent) {
            $userAgent = $session->user_agent;
            
            // Détecter le navigateur
            $browser = "Inconnu";
            if (strpos($userAgent, 'Edg') !== false) {
                $browser = "Microsoft Edge";
            } elseif (strpos($userAgent, 'Chrome') !== false) {
                $browser = "Google Chrome";
            } elseif (strpos($userAgent, 'Firefox') !== false) {
                $browser = "Mozilla Firefox";
            } elseif (strpos($userAgent, 'Safari') !== false) {
                $browser = "Safari";
            } elseif (strpos($userAgent, 'Opera') !== false || strpos($userAgent, 'OPR') !== false) {
                $browser = "Opera";
            }
            
            // Détecter le système d'exploitation
            $os = "Inconnu";
            if (strpos($userAgent, 'Windows') !== false) {
                $os = "Windows";
            } elseif (strpos($userAgent, 'Mac') !== false) {
                $os = "macOS";
            } elseif (strpos($userAgent, 'Android') !== false) {
                $os = "Android";
            } elseif (strpos($userAgent, 'iOS') !== false || strpos($userAgent, 'iPhone') !== false || strpos($userAgent, 'iPad') !== false) {
                $os = "iOS";
            } elseif (strpos($userAgent, 'Linux') !== false) {
                $os = "Linux";
            }
            
            // Détecter le type d'appareil
            $device = "Desktop";
            if (strpos($userAgent, 'Mobile') !== false || strpos($userAgent, 'Android') !== false || strpos($userAgent, 'iPhone') !== false) {
                $device = "Mobile";
            } elseif (strpos($userAgent, 'Tablet') !== false || strpos($userAgent, 'iPad') !== false) {
                $device = "Tablet";
            }
            
            $user->browser = $browser;
            $user->os = $os;
            $user->device_type = $device;
        } else {
            $user->browser = null;
            $user->os = null;
            $user->device_type = null;
        }
        return response()->json([
            'success' => true,
            'data' => $user,
            'packs' => $packs
        ]);
    }

    public function update(UpdateProfileRequest $request)
    {
        try {
            $user = $request->user();
            $validated = $request->validated();

            // Gérer l'upload de la photo de profil
            if ($request->hasFile('picture')) {
                $validated['picture'] = $user->uploadProfilePicture($request->file('picture'));
            }

            // Gérer le mot de passe
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du profil : ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 