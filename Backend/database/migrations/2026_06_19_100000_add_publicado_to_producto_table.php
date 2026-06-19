<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            // Si está en false el producto no se muestra en el cotizador público
            // (FrontEnd_Clientes), pero sigue visible/editable en el panel interno.
            // Default true para no ocultar de golpe los productos ya existentes.
            $table->boolean('publicado')->default(true)->after('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('publicado');
        });
    }
};
