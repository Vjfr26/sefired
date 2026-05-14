<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apov_cobertura', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('apov_id');
            $table->enum('tipo_cobertura', [
                'muerte_accidental',
                'invalidez',
                'medicos',
                'funerarios',
            ]);
            $table->decimal('tasa', 10, 4)->default(0.0000);
            $table->decimal('suma_bronze', 18, 2)->default(0.00);
            $table->decimal('suma_plata', 18, 2)->default(0.00);
            $table->decimal('suma_oro', 18, 2)->default(0.00);

            $table->unique(['apov_id', 'tipo_cobertura'], 'uq_apov_cobertura');
            $table->foreign('apov_id', 'fk_apov_cob_apov')
                  ->references('id')->on('apov')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apov_cobertura');
    }
};
