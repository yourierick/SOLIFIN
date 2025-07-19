<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\UserPack;
use App\Services\CodeGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CodeGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $codeGenerationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->codeGenerationService = new CodeGenerationService();
        
        // Définir l'URL du frontend pour les tests
        config(['app.frontend_url' => 'http://localhost:5173']);
    }

    /** @test */
    public function it_can_generate_unique_account_id()
    {
        // Créer quelques utilisateurs avec des IDs connus
        User::factory()->create(['account_id' => 'SOL0001']);
        User::factory()->create(['account_id' => 'SOL0002']);

        // Générer un nouvel ID
        $accountId = $this->codeGenerationService->generateUniqueAccountId();

        // Vérifier le format
        $this->assertStringStartsWith('SOL', $accountId);
        $this->assertEquals(7, strlen($accountId));
        
        // Vérifier qu'il est unique
        $this->assertFalse(User::where('account_id', $accountId)->exists());
    }

    /** @test */
    public function it_can_generate_unique_referral_code()
    {
        // Créer quelques utilisateurs avec des codes de parrainage connus
        User::factory()->create(['referral_code' => 'REF0001']);
        User::factory()->create(['referral_code' => 'REF0002']);

        // Générer un nouveau code
        $referralCode = $this->codeGenerationService->generateUniqueReferralCode();

        // Vérifier le format
        $this->assertStringStartsWith('REF', $referralCode);
        $this->assertEquals(7, strlen($referralCode));
        
        // Vérifier qu'il est unique
        $this->assertFalse(User::where('referral_code', $referralCode)->exists());
    }

    /** @test */
    public function it_can_build_referral_url()
    {
        // Générer une URL de parrainage
        $referralUrl = $this->codeGenerationService->buildReferralUrl('REF0001');

        // Vérifier le format
        $this->assertEquals('http://localhost:5173/register?referral_code=REF0001', $referralUrl);
    }

    /** @test */
    public function it_can_generate_pack_referral_code()
    {
        // Créer quelques packs utilisateur avec des codes de parrainage connus
        UserPack::factory()->create(['referral_code' => 'SPRP0001']);
        UserPack::factory()->create(['referral_code' => 'SPRP0002']);

        // Générer un nouveau code pour un pack nommé "Premium"
        $referralData = $this->codeGenerationService->generatePackReferralCode('Premium');

        // Vérifier le format et les données
        $this->assertArrayHasKey('referral_code', $referralData);
        $this->assertArrayHasKey('referral_link', $referralData);
        $this->assertArrayHasKey('referral_letter', $referralData);
        $this->assertArrayHasKey('referral_number', $referralData);
        $this->assertArrayHasKey('referral_prefix', $referralData);
        
        $this->assertEquals('P', $referralData['referral_letter']);
        $this->assertEquals('SPR', $referralData['referral_prefix']);
        $this->assertStringStartsWith('SPR', $referralData['referral_code']);
        $this->assertStringContains('P', $referralData['referral_code']);
        $this->assertStringContains('register?referral_code=', $referralData['referral_link']);
        
        // Vérifier qu'il est unique
        $this->assertFalse(UserPack::where('referral_code', $referralData['referral_code'])->exists());
    }
}
