<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_contacto', function (Blueprint $table) {
            $table->id();
            $table->string('email', 120);
            $table->string('motivo', 30);
            $table->string('destino', 20);
            $table->string('status', 20)->default('pendiente');
            $table->string('ip', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_contacto');
    }
};
