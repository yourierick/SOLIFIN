<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\Pack;
use App\Models\Page;
use App\Models\Role;
use App\Models\ReferralInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Services\ReferralCodeService;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Services\CommissionService;
use App\Models\ExchangeRates;
use App\Notifications\VerifyEmailWithCredentials;
use App\Notifications\ReferralInvitationConverted;
use Carbon\Carbon;
use App\Models\Setting;


class RegisterController extends Controller
{
    public function register(Request $request, $pack_id)
    {
        try {
            // Dans le cas d'un paiement SerdiPay, toutes les validations ont déjà été faites
            // Cette fonction ne sert plus qu'à créer l'utilisateur et ses données associées
            $validated = $request->all();

            DB::beginTransaction();

            // Utiliser le service d'inscription pour créer l'utilisateur et toutes les données associées
            $registrationService = app(RegistrationService::class);
            $user = $registrationService->registerUserWithPack($validated, $pack_id);
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'inscription: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription'
            ], 500);
        }
    }
}