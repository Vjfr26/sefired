<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `poliza.pago` guarda un resumen de las formas de pago usadas al emitir
 * (p.ej. "Transferencia USD / Transferencia Bs. / Transferencia EUR"). Con
 * varias formas de pago ese texto supera los 30 caracteres originales y el
 * INSERT fallaba con "Data too long for column 'pago'" (SQLSTATE 22001),
 * devolviendo un 500 al emitir. Se amplía a 255.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->string('pago', 255)->change();
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->string('pago', 30)->change();
        });
    }
};
