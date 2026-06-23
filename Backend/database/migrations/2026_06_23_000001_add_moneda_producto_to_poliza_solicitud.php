<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Moneda NATIVA del producto con el que se calculó total/cobertura_dolares
 * (USD/BS/EUR) — distinta de `poliza.moneda`, que es la moneda en la que el
 * cliente pagó. Sin esta columna, total/total_bs se calculaban asumiendo
 * USD sin importar la moneda real del producto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->string('moneda_producto', 10)->default('USD')->after('total_bs');
        });

        Schema::table('poliza', function (Blueprint $table) {
            $table->string('moneda_producto', 10)->default('USD')->after('total_bs');
        });

        // Históricamente todo se calculó forzando USD, así que el default ya
        // es correcto para filas existentes — backfill explícito por claridad.
        DB::table('solicitud')->whereNull('moneda_producto')->update(['moneda_producto' => 'USD']);
        DB::table('poliza')->whereNull('moneda_producto')->update(['moneda_producto' => 'USD']);
    }

    public function down(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropColumn('moneda_producto');
        });

        Schema::table('poliza', function (Blueprint $table) {
            $table->dropColumn('moneda_producto');
        });
    }
};
