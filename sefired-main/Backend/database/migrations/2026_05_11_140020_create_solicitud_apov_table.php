<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitud_apov', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('vehiculo_id');
            $table->string('plan_muerte_accidental', 20);
            $table->string('plan_invalidez', 20);
            $table->string('plan_medicos', 20);
            $table->string('plan_funerarios', 30);

            $table->index('vehiculo_id', 'idx_sol_apov_vehiculo');
            $table->foreign('vehiculo_id', 'fk_sol_apov_vehiculo')
                  ->references('id')->on('vehiculo')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitud_apov');
    }
};
