<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insérer les paramètres par défaut pour les restrictions de pays
        DB::table('settings')->insert([
            [
                'key' => 'enable_country_restrictions',
                'value' => '0',
                'description' => 'Activer ou désactiver les restrictions d\'accès par pays (1 = activé, 0 = désactivé)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'country_restrictions',
                'value' => '[]',
                'description' => 'Liste des pays autorisés ou bloqués au format JSON',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'withdrawal_fee_percentage',
                'value' => '0',
                'description' => 'Pourcentage des frais de retrait',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'withdrawal_commission',
                'value' => '0',
                'description' => 'Pourcentage de la commission du premier parrain du requérant de la demande de retrait',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'transfer_fee_percentage',
                'value' => '0',
                'description' => 'Pourcentage des frais de transfert de fond entre wallet',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'transfer_commission',
                'value' => '0',
                'description' => 'Pourcentage de la commission du premier parrain pour le transfert entre wallet',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'purchase_fee_percentage',
                'value' => '0',
                'description' => 'Pourcentage des frais d\'achat des packs',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'purchase_commission_system',
                'value' => '0',
                'description' => 'Pourcentage des frais de commission système pour la vente des formations et des produits digitaux',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Réseaux sociaux
            [
                'key' => 'facebook_url',
                'value' => '',
                'description' => 'Lien vers la page Facebook',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'whatsapp_url',
                'value' => '',
                'description' => 'Lien vers WhatsApp ou numéro de contact',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'twitter_url',
                'value' => '',
                'description' => 'Lien vers le compte X (Twitter)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'instagram_url',
                'value' => '',
                'description' => 'Lien vers le compte Instagram',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Documents légaux
            [
                'key' => 'terms_of_use',
                'value' => '',
                'description' => 'Conditions d\'utilisation de la plateforme',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'privacy_policy',
                'value' => '',
                'description' => 'Politique de confidentialité de la plateforme',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Photo du fondateur
            [
                'key' => 'founder_photo',
                'value' => '',
                'description' => 'URL de la photo du fondateur',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'jeton_expiration_months',
                'value' => '1',
                'description' => 'Durée d\'expiration des jetons Esengo en mois',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'ticket_expiration_months',
                'value' => '1',
                'description' => 'Durée d\'expiration des tickets gagnants en mois',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'essai_duration_days',
                'value' => '10',
                'description' => 'Durée de l\'essai en jours pour les nouveaux utilisateurs',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'dual_currency',
                'value' => 'non',
                'description' => 'Activer ou desactiver la dual currency (oui ou non)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
