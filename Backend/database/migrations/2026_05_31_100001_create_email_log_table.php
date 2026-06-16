<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_log', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 50);                       // poliza_emitida, factura, renovacion, etc.
            $table->string('destinatario', 150);
            $table->string('asunto', 255);
            $table->unsignedInteger('persona_id')->nullable();
            $table->unsignedInteger('poliza_id')->nullable();
            $table->enum('status', ['enviado', 'error'])->default('enviado');
            $table->text('error_msg')->nullable();
            $table->timestamp('sent_at')->useCurrent();

            $table->index('tipo');
            $table->index('persona_id');
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_log');
    }
};
