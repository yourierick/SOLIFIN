<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\RegistrationService;
use App\Models\Setting;
use Carbon\Carbon;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required'
        ]);

        // Déterminer si l'identifiant est un email ou un account_id
        $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'account_id';
        
        // Rechercher l'utilisateur
        $user = User::where($loginField, $request->login)->first();
        
        // Vérifier si l'utilisateur existe et si le mot de passe est correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            // throw ValidationException::withMessages([
            //     'login' => ['Les identifiants fournis sont incorrects.'],
            // ]);
            return response()->json([
                'message' => 'Les identifiants fournis sont incorrects.'
            ]);
        }
        
        // Vérifier si le compte est actif ou en essai
        if ($user->status !== 'active' && $user->status !== RegistrationService::STATUS_TRIAL) {
            // throw ValidationException::withMessages([
            //     'login' => ['Ce compte a été désactivé, veuillez contacter l\'équipe SOLIFIN pour sa réactivation.'],
            // ]);
            return response()->json([
                'message' => 'Ce compte a été désactivé, veuillez contacter l\'équipe SOLIFIN pour sa réactivation.'
            ]);
        }
        
        // Authentifier l'utilisateur manuellement
        Auth::login($user, true);
        
        if (!$request->session()->has('_token')) {
            $request->session()->regenerate();
        }
        
        $user->picture = $user->getProfilePictureUrlAttribute();
        
        $response = ['user' => $user];
        
        // Si l'utilisateur est en période d'essai, ajouter les informations sur la date d'expiration
        if ($user->status === RegistrationService::STATUS_TRIAL) {
            $trialDurationDays = (int) Setting::getValue('essai_duration_days', 10);
            $createdAt = Carbon::parse($user->created_at);
            $trialEndDate = $createdAt->copy()->addDays($trialDurationDays);
            
            $response['trial'] = [
                'isTrialUser' => true,
                'trialEndDate' => $trialEndDate->format('Y-m-d'),
                'daysRemaining' => now()->diffInDays($trialEndDate, false),
                'message' => 'Votre période d\'essai se termine le ' . $trialEndDate->format('d/m/Y') . '. Veuillez souscrire à un pack à partir de l\'onglet Mes Packs pour conserver votre compte.'
            ];
        } else {
            $response['trial'] = ['isTrialUser' => false];
        }
        
        return response()->json($response);
    }

    public function logout(Request $request)
    {
        // Vérifier si la déconnexion est due à l'inactivité
        $reason = $request->query('reason');
        $message = 'Déconnexion réussie';
        
        if ($reason === 'inactivity') {
            $message = 'Session expiree par inactivite';
            // Journaliser l'expiration de session pour debogage
            //\Log::info('Session expiree pour utilisateur ' . (Auth::id() ?? 'inconnu') . ' apres 10 minutes inactivite');
        }
        
        // Déconnecter l'utilisateur avec le guard web
        Auth::guard('web')->logout();
        
        // Invalider la session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => $message
        ]);
    }
}