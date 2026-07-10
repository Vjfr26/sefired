<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogo de oficinas/sedes. Antes no existía: el select del frontend era
 * una lista fija (USER_SEDES) y el dígito de oficina del código de póliza
 * vivía horneado en CodigoPoliza::OFICINAS. `codigo` es ese dígito (1-9,
 * el código de póliza le reserva una sola posición).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('oficina', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 60)->unique();
            $table->unsignedTinyInteger('codigo')->unique();
            $table->timestamps();
        });

        // Sedes existentes, con los mismos dígitos que ya llevan las pólizas
        // emitidas (CodigoPoliza::OFICINAS). insertOrIgnore = repetible.
        DB::table('oficina')->insertOrIgnore([
            ['nombre' => 'Caracas Principal', 'codigo' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Maracaibo',         'codigo' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Valencia',          'codigo' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('oficina');
    }
};
