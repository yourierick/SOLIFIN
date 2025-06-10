<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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
                'key' => 'sending_fee_percentage',
                'value' => '0',
                'description' => 'Pourcentage des frais d\'achat des formations',
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
