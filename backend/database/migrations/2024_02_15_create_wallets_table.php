<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('balance_usd', 10, 2)->default(0);
            $table->decimal('balance_cdf', 10, 2)->default(0);
            $table->decimal('total_earned_usd', 10, 2)->default(0);
            $table->decimal('total_earned_cdf', 10, 2)->default(0);
            $table->decimal('total_withdrawn_usd', 10, 2)->default(0);
            $table->decimal('total_withdrawn_cdf', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->onDelete('cascade');
            $table->enum('mouvment', ['in', 'out']);
            $table->enum('type', ['withdrawal', 'commission de parrainage', 'commission de transfert', 'transfer', 'digital_product_sale', 'reception', 'commission de retrait', 'purchase', 'virtual_purchase', 'remboursement']);
            $table->decimal('amount', 10, 2);
            $table->enum('currency', ['USD', 'CDF'])->default('USD');
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
}; 