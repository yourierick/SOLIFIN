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
        Schema::create('transaction_fees', function (Blueprint $table) {
            $table->id();
            $table->string('payment_method')->comment('Nom du moyen de paiement');
            $table->string('payment_type')->comment('Type de paiement');
            $table->boolean('is_active')->default(true)->comment('Indique si ce moyen de paiement est actif');
            $table->timestamps();
        });

        // Insérer les paramètres par défaut pour les restrictions de pays
        DB::table('transaction_fees')->insert([
            [
                'payment_method' => 'orange-money',
                'payment_type' => 'mobile-money',
                'created_at' => now(),
            ],
            [
                'payment_method' => 'airtel-money',
                'payment_type' => 'mobile-money',
                'created_at' => now(),
            ],
            [
                'payment_method' => 'm-pesa',
                'payment_type' => 'mobile-money',
                'created_at' => now(),
            ],
            [
                'payment_method' => 'afrimoney',
                'payment_type' => 'mobile-money',
                'created_at' => now(),
            ],
            [
                'payment_method' => 'visa',
                'payment_type' => 'credit-card',
                'created_at' => now(),
            ],
            [
                'payment_method' => 'mastercard',
                'payment_type' => 'credit-card',
                'created_at' => now(),
            ],
            [
                'payment_method' => 'american-express',
                'payment_type' => 'credit-card',
                'created_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_fees');
    }
};
