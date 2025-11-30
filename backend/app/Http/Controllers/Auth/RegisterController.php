<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RegistrationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Services\ReferralCodeService;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\ExchangeRates;
use Carbon\Carbon;


class RegisterController extends Controller
{
    public function register(Request $request)
    {
        try {
            // Messages d'erreur personnalisés en français
            $messages = [
                'email.required' => "L'adresse email est obligatoire",
                'email.email' => "Veuillez saisir une adresse email valide",
                'email.unique' => "Cette adresse email a déjà été utilisée",
                'name.required' => "Le nom est obligatoire",
                'name.max' => "Le nom ne doit pas dépasser 255 caractères",
                'password.required' => "Le mot de passe est obligatoire",
                'password.min' => "Le mot de passe doit contenir au moins 8 caractères",
                'password.confirmed' => "Les mots de passe ne correspondent pas",
                'address.required' => "L'adresse est obligatoire",
                'phone.required' => "Le numéro de téléphone est obligatoire",
                'phone.unique' => "Ce numéro de téléphone a déjà été utilisé",
                'whatsapp.unique' => "Ce numéro WhatsApp a déjà été utilisé",
                'gender.required' => "Le sexe est obligatoire",
                'country.required' => "Le pays est obligatoire",
                'province.required' => "La province est obligatoire",
                'city.required' => "La ville est obligatoire",
            ];

            $validator = Validator::make($request->all(), [
                'email' => 'required|email|unique:users',
                'name' => 'required|string|max:255',
                'password' => 'required|string|min:8|confirmed',
                'address' => 'required|string',
                'phone' => 'required|string|unique:users',
                'whatsapp' => 'nullable|string|unique:users',
                'gender' => 'required|string',
                'country' => 'required|string',
                'province' => 'required|string',
                'city' => 'required|string',
                'acquisition_source' => 'nullable|string',
            ], $messages);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors()
                ]);
            }

            DB::beginTransaction();

            // Utiliser le service d'inscription pour créer l'utilisateur et toutes les données associées
            $registrationService = app(RegistrationService::class);
            $user = $registrationService->registerUser($validator->validated());
            
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