<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Igual que `poliza.pago` (ver 2026_07_03_000001), `factura.forma_pago` guarda
 * el resumen de las formas de pago usadas (p.ej. "Transferencia USD /
 * Transferencia Bs. / Transferencia EUR"). Con varias formas ese texto supera
 * los 35 caracteres originales y el INSERT del recibo fallaba con "Data too
 * long for column 'forma_pago'" (SQLSTATE 22001), devolviendo un 500 al emitir
 * la póliza. Se amplía a 255.
 *
 * `retiro_efectivo.forma_pago` NO se toca: guarda una sola forma y participa en
 * un índice único, donde ampliarla a 255 arriesga exceder el límite de clave.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('factura', function (Blueprint $table) {
            $table->string('forma_pago', 255)->change();
        });
    }

    public function down(): void
    {
        Schema::table('factura', function (Blueprint $table) {
            $table->string('forma_pago', 35)->change();
        });
    }
};
