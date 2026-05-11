<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poliza_rcv', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('vehiculo_id');
            $table->decimal('suma_persona', 18, 2)->default(0.00);
            $table->decimal('prima_persona', 18, 2)->default(0.00);
            $table->decimal('suma_cosa', 18, 2)->default(0.00);
            $table->decimal('prima_cosa', 18, 2)->default(0.00);

            $table->index('vehiculo_id', 'idx_pol_rcv_vehiculo');
            $table->foreign('vehiculo_id', 'fk_pol_rcv_vehiculo')
                  ->references('id')->on('vehiculo')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poliza_rcv');
    }
};
