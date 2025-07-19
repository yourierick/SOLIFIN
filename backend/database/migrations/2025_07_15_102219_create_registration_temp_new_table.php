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
        Schema::create('registration_temp', function (Blueprint $table) {
            $table->id();
            $table->string('temp_id')->unique();
            $table->text('registration_data');
            // Champ pour stocker les données calculées séparément
            $table->text('calculated_data')->nullable();
            $table->unsignedBigInteger('pack_id');
            // Champ pour stocker l'ID de l'utilisateur créé
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('email');
            $table->string('session_id')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('status')->default('pending');
            $table->text('error_message')->nullable();
            $table->string('retry_token', 32)->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamp('last_retry_at')->nullable();
            
            // Champs pour le suivi du paiement
            $table->boolean('payment_confirmed')->default(false);
            $table->timestamp('payment_confirmed_at')->nullable();
            
            // Index pour faciliter les recherches par token de reprise
            $table->index(['retry_token', 'email']);
            $table->index(['payment_confirmed', 'status']);
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->index(['session_id', 'transaction_id']);
            $table->index(['email', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_temp_new');
    }
};
