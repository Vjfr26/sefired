<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Campo libre ("Otros") para anotar cualquier detalle del bien que no
 * encaje en sus atributos estructurados (golpes previos, modificaciones,
 * acuerdos verbales con el cliente, etc.). Aparece en el cuadro póliza.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bien_asegurado', function (Blueprint $table) {
            $table->text('observaciones')->nullable()->after('descripcion');
        });
    }

    public function down(): void
    {
        Schema::table('bien_asegurado', function (Blueprint $table) {
            $table->dropColumn('observaciones');
        });
    }
};
