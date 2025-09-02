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
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable(); // Nom optionnel pour la conversation
            $table->foreignId('user_one_id')->constrained('users')->onDelete('cascade'); // Premier utilisateur
            $table->foreignId('user_two_id')->constrained('users')->onDelete('cascade'); // Deuxième utilisateur
            $table->timestamps();
            
            // S'assurer que la combinaison des deux utilisateurs est unique
            $table->unique(['user_one_id', 'user_two_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_rooms');
    }
};
