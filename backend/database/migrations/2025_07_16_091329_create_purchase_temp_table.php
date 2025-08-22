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
        Schema::create('purchase_temp', function (Blueprint $table) {
            $table->id();
            $table->string('temp_id')->unique()->comment('Identifiant temporaire unique pour cette transaction');
            $table->unsignedBigInteger('user_id')->comment('ID de l\'utilisateur qui effectue l\'achat');
            $table->unsignedBigInteger('pack_id')->nullable()->comment('ID du pack acheté');
            $table->enum('transaction_type', ['purchase_pack', 'renew_pack', 'purchase_virtual'])->default('purchase_pack')->comment('Type de transaction: achat_pack, 
                            renouvellement_pack, achat_virtuel');
            $table->json('purchase_data')->comment('Données complètes de l\'achat au format JSON');
            $table->string('session_id')->nullable()->comment('ID de session SerdiPay');
            $table->string('transaction_id')->nullable()->comment('ID de transaction SerdiPay');
            $table->string('status')->default('pending')->comment('Status de l\'achat: pending, completed, failed');
            $table->text('error_message')->nullable()->comment('Message d\'erreur en cas d\'echec');
            $table->string('retry_token')->nullable()->comment('Token pour reprendre un achat échoué');
            $table->boolean('payment_confirmed')->default(false)->comment('Indique si le paiement a été confirmé');
            $table->timestamp('completed_at')->nullable()->comment('Date de finalisation de l\'achat');
            $table->timestamps();
            
            // Index
            $table->index('user_id');
            $table->index('pack_id');
            $table->index('session_id');
            $table->index('transaction_id');
            $table->index('retry_token');
            
            // Contraintes de clé étrangère
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('pack_id')->references('id')->on('packs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_temp');
    }
};
