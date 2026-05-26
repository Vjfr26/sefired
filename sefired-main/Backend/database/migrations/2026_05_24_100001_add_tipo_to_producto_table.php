<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            // Tipo de producto — determina qué flujo de simulación y qué tarifario usa
            $table->enum('tipo', ['rcv', 'apov', 'alpd', 'ec', 'ep'])
                  ->default('alpd')
                  ->after('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('tipo');
        });
    }
};
