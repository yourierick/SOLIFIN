<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBroadcastMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('broadcast_messages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['text', 'image', 'video'])->default('text');
            $table->string('media_url')->nullable();
            $table->boolean('status')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        // Table pour suivre quels utilisateurs ont vu quels messages
        Schema::create('broadcast_message_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broadcast_message_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('seen_at');
            $table->timestamps();
            
            // Un utilisateur ne peut voir un message qu'une seule fois
            $table->unique(['broadcast_message_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('broadcast_message_user');
        Schema::dropIfExists('broadcast_messages');
    }
}
