<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Trazabilidad: Añadir tarifario_id a poliza_apov y poliza_rcv
        Schema::table('poliza_apov', function (Blueprint $table) {
            $table->unsignedInteger('tarifario_apov_id')->nullable()->after('poliza_id');
            $table->foreign('tarifario_apov_id', 'fk_pol_apov_tarifario')
                  ->references('id')->on('tarifario_apov')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });

        Schema::table('poliza_rcv', function (Blueprint $table) {
            $table->unsignedInteger('tarifario_rcv_id')->nullable()->after('poliza_id');
            $table->foreign('tarifario_rcv_id', 'fk_pol_rcv_tarifario')
                  ->references('id')->on('tarifario_rcv')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });

        // 2. Renombrar ec_ep a tarifario_ec_ep
        Schema::rename('ec_ep', 'tarifario_ec_ep');

        // 3. Crear poliza_ec_ep
        Schema::create('poliza_ec_ep', function (Blueprint $table) {
            $table->unsignedInteger('poliza_id');
            $table->unsignedInteger('tarifario_ec_ep_id')->nullable();
            
            // Sumas copiadas (snapshot)
            $table->decimal('suma_cobertura', 18, 2)->default(0.00);
            $table->decimal('prima_cobertura', 18, 2)->default(0.00);
            $table->decimal('suma_total', 18, 2)->default(0.00);
            $table->decimal('suma_plata', 18, 2)->default(0.00);
            $table->decimal('prima_plata', 18, 2)->default(0.00);
            $table->decimal('suma_oro', 18, 2)->default(0.00);
            $table->decimal('prima_oro', 18, 2)->default(0.00);

            $table->primary('poliza_id');
            $table->foreign('poliza_id', 'fk_pol_ecep_poliza')
                  ->references('id')->on('poliza')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
                  
            $table->foreign('tarifario_ec_ep_id', 'fk_pol_ecep_tarifario')
                  ->references('id')->on('tarifario_ec_ep')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poliza_ec_ep');
        
        Schema::rename('tarifario_ec_ep', 'ec_ep');

        Schema::table('poliza_rcv', function (Blueprint $table) {
            $table->dropForeign('fk_pol_rcv_tarifario');
            $table->dropColumn('tarifario_rcv_id');
        });

        Schema::table('poliza_apov', function (Blueprint $table) {
            $table->dropForeign('fk_pol_apov_tarifario');
            $table->dropColumn('tarifario_apov_id');
        });
    }
};
