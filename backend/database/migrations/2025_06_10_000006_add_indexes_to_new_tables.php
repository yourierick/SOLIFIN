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
        // Ajout d'index à la table cadeaux
        Schema::table('cadeaux', function (Blueprint $table) {
            $table->index('actif');
            $table->index('probabilite');
        });

        // Ajout d'index à la table tickets_gagnants
        Schema::table('tickets_gagnants', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('cadeau_id');
            $table->index('date_expiration');
            $table->index('consomme');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Suppression des index de la table cadeaux
        Schema::table('cadeaux', function (Blueprint $table) {
            $table->dropIndex(['actif']);
            $table->dropIndex(['probabilite']);
        });

        // Suppression des index de la table tickets_gagnants
        Schema::table('tickets_gagnants', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['cadeau_id']);
            $table->dropIndex(['date_expiration']);
            $table->dropIndex(['consomme']);
        });
    }
};
