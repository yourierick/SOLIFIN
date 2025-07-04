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
        Schema::create('digital_product_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('digital_product_id')->constrained('digital_products')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('prix', 10, 2);
            $table->decimal('frais', 10, 2)->nullable();
            $table->decimal('montant_total', 10, 2)->nullable();
            $table->string('devise', 10)->default('USD');
            $table->string('transaction_id')->nullable();
            $table->enum('statut', ['en_cours', 'complete', 'annule'])->default('en_cours');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('digital_product_purchases');
    }
};
