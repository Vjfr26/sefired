<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poliza_apov', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('vehiculo_id');
            $table->decimal('suma_muerte_accidental', 18, 2)->default(0.00);
            $table->decimal('suma_invalidez', 18, 2)->default(0.00);
            $table->decimal('suma_medicos', 18, 2)->default(0.00);
            $table->decimal('suma_funerarios', 18, 2)->default(0.00);

            $table->index('vehiculo_id', 'idx_pol_apov_vehiculo');
            $table->foreign('vehiculo_id', 'fk_pol_apov_vehiculo')
                  ->references('id')->on('vehiculo')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poliza_apov');
    }
};
