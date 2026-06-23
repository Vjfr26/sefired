<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Si las pólizas de este producto llevan certificado (pólizas colectivas,
 * con varios bienes/beneficiarios) o muestran el número de recibo en su
 * lugar (pólizas individuales) en el cuadro póliza del PDF.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->boolean('lleva_certificado')->default(true)->after('aplica_beneficiarios');
        });

        // Backfill: solo los productos que admiten varios bienes (RCV, APOV)
        // pueden venderse como pólizas colectivas hoy. `aplica_beneficiarios`
        // NO implica colectiva — un seguro de Vida Individual también
        // designa beneficiarios y no por eso lleva certificado.
        DB::table('producto')->update([
            'lleva_certificado' => DB::raw('(permite_multiples_bienes = 1)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('lleva_certificado');
        });
    }
};
