<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adapts `solicitud` for non-vehicle products:
 *  - placa becomes nullable (EC, EP, life products have no plate)
 *  - tarifario_id links to the specific rate row used
 *  - asegurado_nombre / asegurado_ci for the insured person (distinct from the policyholder/tomador)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            // Allow non-vehicle policies (EC, EP, ALPD…)
            $table->string('placa', 20)->nullable()->change();

            // Which tarifario row was selected in the wizard
            $table->unsignedBigInteger('tarifario_id')->nullable()->after('producto_id');
            $table->foreign('tarifario_id')
                  ->references('id')->on('tarifario')
                  ->onDelete('set null')
                  ->onUpdate('cascade');

            // The insured (asegurado) may differ from the policyholder (tomador)
            $table->string('asegurado_nombre', 120)->nullable()->after('ci_tomador');
            $table->string('asegurado_ci',     20)->nullable()->after('asegurado_nombre');
        });
    }

    public function down(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropForeign('solicitud_tarifario_id_foreign');
            $table->dropColumn(['tarifario_id', 'asegurado_nombre', 'asegurado_ci']);
            $table->string('placa', 20)->nullable(false)->change();
        });
    }
};
