<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Password;

// Mettre la route de vérification d'email en dehors des groupes de middleware
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id) {
    $user = User::findOrFail($id);
    
    if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
        throw new \Illuminate\Auth\Access\AuthorizationException('Le lien de vérification est invalide');
    }

    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?already_verified=1');
    }

    $user->markEmailAsVerified();
    
    \Log::info('Email vérifié pour l\'utilisateur ' . $user->email);
    $redirectPath = $user->is_admin ? '/admin' : '/dashboard';
    \Log::info('Redirection vers ' . env('FRONTEND_URL') . $redirectPath);
    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?verified=1');
})->middleware(['throttle:6,1'])->name('verification.verify');

// Route pour renvoyer l'email de vérification
Route::get('/email/resend-verification/{email}', function ($email) {
    $user = \App\Models\User::where('email', $email)->firstOrFail();
    $user->sendEmailVerificationNotification();
    
    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?verification=sent');
})->middleware(['throttle:6,1'])->name('verification.resend');

// Routes pour la réinitialisation de mot de passe
Route::get('/reset-password/{token}', function (string $token, Request $request) {
    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password/' . $token . '?email=' . $request->email);
})->middleware('guest')->name('password.reset');

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (\App\Models\User $user, string $password) {
            $user->forceFill([
                'password' => \Illuminate\Support\Facades\Hash::make($password)
            ]);

            $user->save();
        }
    );

    return $status === Password::PASSWORD_RESET
                ? redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?reset=success')
                : back()->withErrors(['email' => [__($status)]]);
})->middleware('guest')->name('password.update');