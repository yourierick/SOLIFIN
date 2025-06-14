<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;

class PasswordResetController extends Controller
{
    public function showLinkRequestForm()
    {
        return view('auth.passwords.email');
    }

    public function sendResetLinkEmail(Request $request)
    {
        try {
            // Log la requête complète
            \Log::info('Password reset request received', [
                'email' => $request->email,
                'headers' => $request->headers->all(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
            
            // Vérifier si l'utilisateur existe avant de continuer
            $user = \App\Models\User::where('email', $request->email)->first();
            if (!$user) {
                \Log::warning('Password reset attempted for non-existent user', ['email' => $request->email]);
                return response()->json(['success' => false, 'error' => 'Nous ne trouvons pas d\'utilisateur avec cette adresse e-mail.'], 404);
            }
            
            \Log::info('User found for password reset', [
                'user_id' => $user->id,
                'email_verified' => !empty($user->email_verified_at)
            ]);
            
            $request->validate([
                'email' => ['required', 'email'],
            ]);

            // Vérifier la configuration de réinitialisation de mot de passe
            \Log::info('Password broker configuration', [
                'broker' => config('auth.defaults.passwords'),
                'provider' => config('auth.passwords.users.provider'),
                'table' => config('auth.passwords.users.table'),
                'expire' => config('auth.passwords.users.expire')
            ]);
            
            // Vérifier si la table de réinitialisation existe
            $tableExists = \Illuminate\Support\Facades\Schema::hasTable(config('auth.passwords.users.table'));
            \Log::info('Password reset tokens table exists: ' . ($tableExists ? 'Yes' : 'No'));
            
            $status = Password::sendResetLink(
                $request->only('email')
            );

            \Log::info('Password reset link status', [
                'email' => $request->email,
                'status' => $status,
                'status_code' => $status === Password::RESET_LINK_SENT ? 'RESET_LINK_SENT' : 'FAILED',
                'message' => __($status)
            ]);

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'success' => true, 
                    'message' => "Un lien de réinitialisation de mot de passe a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception et suivre les instructions."
                ]);
            } else {
                // Gérer les différents types d'erreurs avec des messages personnalisés
                $errorMessage = match($status) {
                    Password::RESET_THROTTLED => "Vous avez déjà demandé un lien de réinitialisation récemment. Veuillez attendre avant de réessayer.",
                    Password::INVALID_USER => "Aucun compte n'est associé à cette adresse email.",
                    default => "Une erreur est survenue lors de l'envoi du lien de réinitialisation."
                };
                
                return response()->json(['success' => false, 'error' => $errorMessage], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Exception in password reset process', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function showResetForm(Request $request, $token)
    {
        return view('auth.passwords.reset', ['token' => $token, 'email' => $request->email]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true, 
                'message' => "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
            ]);
        } else {
            // Gérer les différents types d'erreurs avec des messages personnalisés
            $errorMessage = match($status) {
                Password::INVALID_TOKEN => "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
                Password::INVALID_USER => "Aucun compte n'est associé à cette adresse email.",
                default => "Une erreur est survenue lors de la réinitialisation de votre mot de passe."
            };
            
            return response()->json(['success' => false, 'error' => $errorMessage], 400);
        }
    }
} 