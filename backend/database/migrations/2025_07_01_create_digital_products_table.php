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
        Schema::create('digital_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->onDelete('cascade');
            $table->string('titre');
            $table->text('description');
            $table->enum('type', ['ebook', 'fichier_admin']);
            $table->decimal('prix', 10, 2);
            $table->string('devise', 10)->default('USD');
            $table->string('image')->nullable();
            $table->string('fichier');
            $table->enum('statut', ['en_attente', 'approuve', 'rejete'])->default('en_attente');
            $table->text('raison_rejet')->nullable();
            $table->enum('etat', ['disponible', 'termine'])->default('disponible');
            $table->integer('nombre_ventes')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('digital_products');
    }
};
