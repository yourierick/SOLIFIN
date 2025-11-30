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
        Schema::create('serdi_pay_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('wallet_id')->nullable()->constrained()->onDelete('set null');
            $table->string('email')->nullable();
            $table->string('phone_number', 20);
            $table->string('payment_method', 10); // MP, OM, AM, AF, MC, VISA
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('session_id')->unique()->nullable();
            $table->string('transaction_id')->unique()->nullable();
            $table->string('reference')->nullable();
            $table->enum('type', ['payment', 'withdrawal'])->default('payment');
            $table->enum('payment_type', ['mobile_money', 'card'])->default('mobile_money');
            $table->enum('direction', ['client_to_merchant', 'merchant_to_client'])->default('client_to_merchant');
            $table->enum('status', ['pending', 'completed', 'failed', 'expired'])->default('pending');
            $table->string('purpose')->nullable(); // Par exemple: 'pack_purchase', 'withdrawal', etc.
            $table->json('request_data')->nullable();
            $table->json('response_data')->nullable();
            $table->json('callback_data')->nullable();
            $table->timestamp('callback_received_at')->nullable();
            $table->timestamps();
            
            // Informations spécifiques aux paiements par carte
            $table->string('card_number', 19)->nullable(); // Format: XXXX-XXXX-XXXX-XXXX
            $table->string('card_holder_name')->nullable();
            $table->string('card_expiry')->nullable(); // Format: MM/YY
            $table->string('card_type')->nullable(); // 'mastercard', 'visa'
            
            // Index pour les recherches fréquentes
            $table->index('session_id');
            $table->index('transaction_id');
            $table->index('status');
            $table->index(['user_id', 'status']);
            $table->index(['phone_number', 'status']);
            $table->index('payment_type');
            $table->index('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('serdi_pay_transactions');
    }
};
