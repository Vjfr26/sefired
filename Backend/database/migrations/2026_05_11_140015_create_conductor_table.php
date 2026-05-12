<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conductor', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('persona_id');
            $table->unsignedInteger('vehiculo_id');

            $table->index('persona_id', 'idx_conductor_persona');
            $table->index('vehiculo_id', 'idx_conductor_vehiculo');
            $table->foreign('persona_id', 'fk_conductor_persona')
                  ->references('id')->on('persona')
                  ->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('vehiculo_id', 'fk_conductor_vehiculo')
                  ->references('id')->on('vehiculo')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conductor');
    }
};
