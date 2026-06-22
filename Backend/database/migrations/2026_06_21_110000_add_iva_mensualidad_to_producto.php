<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Antes el sistema mostraba "IVA" en el PDF y "Mensual/Anual" como forma de
 * pago, pero ninguno de los dos era real: el IVA siempre quedaba en 0 (nada
 * lo calculaba) y la frecuencia de pago no cambiaba el monto cobrado. Esto
 * permite configurar, por producto, si aplica IVA (y su %) y si admite pago
 * mensual (y con qué recargo de financiamiento, si alguno).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->boolean('iva_aplica')->default(false)->after('moneda');
            $table->decimal('iva_porcentaje', 5, 2)->nullable()->after('iva_aplica');
            $table->boolean('permite_mensualidades')->default(false)->after('iva_porcentaje');
            $table->decimal('recargo_mensual_pct', 5, 2)->nullable()->after('permite_mensualidades');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn(['iva_aplica', 'iva_porcentaje', 'permite_mensualidades', 'recargo_mensual_pct']);
        });
    }
};
