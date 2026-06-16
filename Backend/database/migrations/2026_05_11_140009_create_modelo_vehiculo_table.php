<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modelo_vehiculo', function (Blueprint $table) {
            $table->increments('id');
            $table->string('marca', 50);
            $table->string('modelo', 50);

            $table->unique(['marca', 'modelo'], 'uq_marca_modelo');
            $table->index('marca', 'idx_marca');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modelo_vehiculo');
    }
};
