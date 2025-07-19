<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPack;
use Illuminate\Support\Str;

class CodeGenerationService
{
    // Constantes pour les préfixes
    const PREFIX_USER_ACCOUNT = 'USR-';
    const PREFIX_REFERRAL = 'SPR';

    /**
     * Génère un identifiant unique pour un utilisateur
     *
     * @return string
     */
    public function generateUniqueAccountId()
    {
        do {
            $accountId = self::PREFIX_USER_ACCOUNT . rand(1, 100) . "-" . strtoupper(Str::random(4));
        } while (User::where('account_id', $accountId)->exists());

        return $accountId;
    }

    /**
     * Génère un code de parrainage unique basé sur le nom du pack
     *
     * @param string $packName
     * @return array Tableau contenant le code et ses composants
     */
    public function generateUniqueReferralCode($packName)
    {
        $referralLetter = substr($packName, 0, 1);
        $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $referralCode = self::PREFIX_REFERRAL . $referralLetter . $referralNumber;

        // Vérifier que le code est unique
        while (UserPack::where('referral_code', $referralCode)->exists()) {
            $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $referralCode = self::PREFIX_REFERRAL . $referralLetter . $referralNumber;
        }

        return [
            'code' => $referralCode,
            'letter' => $referralLetter,
            'number' => $referralNumber,
            'prefix' => self::PREFIX_REFERRAL
        ];
    }

    /**
     * Génère un lien de parrainage basé sur le code
     *
     * @param string $referralCode
     * @return string
     */
    public function generateReferralLink($referralCode)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        return $frontendUrl . "/register?referral_code=" . $referralCode;
    }
    
    /**
     * Génère un code de parrainage pour un pack et son lien associé
     *
     * @param string $packName
     * @return array
     */
    public function generatePackReferralCode($packName)
    {
        $referralData = $this->generateUniqueReferralCode($packName);
        $referralData['link'] = $this->generateReferralLink($referralData['code']);
        
        return $referralData;
    }
}
