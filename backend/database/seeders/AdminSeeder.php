<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Pack;
use App\Models\UserPack;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer l'URL du frontend depuis le fichier .env
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        // Créer l'administrateur
        $admin = User::create([
            'name' => 'Administrateur',
            'sexe' => 'homme',
            'pays' => 'CD',
            'province' => 'SudKivu',
            'ville' => 'Bukavu',
            'address' => '1 Rue de la Paix, 75001 Bukavu',
            'status' => 'active',
            'email' => 'admin@solifin.com',
            'password' => Hash::make('admin123'),
            'is_admin' => true,
            'role_id' => 1,
            'email_verified_at' => now(),
            'phone' => '+243000000000',
        ]);

        // Générer un identifiant de compte unique
        do {
            $account_id = 'ADM-' . rand(1, 100) . '-' . strtoupper(Str::random(4));
        } while (User::where('account_id', $account_id)->exists());

        $admin->account_id = $account_id;
        $admin->save();

        // Créer le wallet pour l'administrateur
        Wallet::create([
            'user_id' => $admin->id,
            'balance_usd' => 0,
            'balance_cdf' => 0,
            'total_earned_usd' => 0,
            'total_earned_cdf' => 0,
            'total_withdrawn_usd' => 0,
            'total_withdrawn_cdf' => 0,
        ]);


        
        // Attribuer tous les packs à l'administrateur
        // Récupérer tous les codes de référence existants pour éviter les vérifications multiples dans la boucle
        $existingReferralCodes = UserPack::pluck('referral_code')->toArray();
        
        Pack::chunk(100, function ($packs) use ($admin, $frontendUrl, &$existingReferralCodes) {
            foreach ($packs as $pack) {
                $referralLetter = substr($pack->name, 0, 1);
                
                // Générer un code de référence unique
                do {
                    $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                    $referralCode = 'SPR' . $referralLetter . $referralNumber;
                } while (in_array($referralCode, $existingReferralCodes));
                
                // Ajouter le nouveau code à la liste des codes existants
                $existingReferralCodes[] = $referralCode;

                // Créer le lien de parrainage en utilisant l'URL du frontend
                $referralLink = $frontendUrl . '/register?referral_code=' . $referralCode;
                
                UserPack::create([
                    'user_id' => $admin->id,
                    'pack_id' => $pack->id,
                    'referral_prefix' => 'SPR',
                    'referral_pack_name' => $pack->name,
                    'referral_letter' => $referralLetter,
                    'referral_number' => $referralNumber,
                    'referral_code' => $referralCode,
                    'link_referral' => $referralLink,
                    'status' => 'active',
                    'purchase_date' => now(),
                    'expiry_date' => null,
                    'payment_status' => 'completed',
                    'is_admin_pack' => true,
                ]);
            }
        });

        $supportAccount = User::create([
            'name' => 'Support',
            'sexe' => 'homme',
            'pays' => 'CD',
            'province' => 'SudKivu',
            'ville' => 'Bukavu',
            'address' => '1 Rue de la Paix, 75001 Bukavu',
            'status' => 'active',
            'email' => 'support@solifin.com',
            'password' => Hash::make('support123'),
            'is_admin' => true,
            'role_id' => 5,
            'email_verified_at' => now(),
            'phone' => '+243000000000',
        ]);

        // Générer un identifiant de compte unique
        do {
            $account_id = 'SUP-' . rand(1, 100) . '-' . strtoupper(Str::random(4));
        } while (User::where('account_id', $account_id)->exists());

        $supportAccount->account_id = $account_id;
        $supportAccount->save();

        // Créer le wallet pour le support
        Wallet::create([
            'user_id' => $supportAccount->id,
            'balance_usd' => 0,
            'balance_cdf' => 0,
            'total_earned_usd' => 0,
            'total_earned_cdf' => 0,
            'total_withdrawn_usd' => 0,
            'total_withdrawn_cdf' => 0,
        ]);
    }
}