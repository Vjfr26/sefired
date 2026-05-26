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
        Schema::create('logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('usuario_id')->nullable();
            $table->string('accion');
            $table->string('tabla')->nullable();
            $table->text('descripcion');
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            // Índice para búsquedas rápidas por usuario o acción
            $table->index('usuario_id');
            $table->index('accion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};
