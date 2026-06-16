<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apov', function (Blueprint $table) {
            $table->increments('id');
            $table->string('tipo_carro', 30);
            $table->decimal('tasa', 10, 4)->default(0.0000);
            $table->decimal('suma_asegurada', 18, 2)->default(0.00);
            $table->decimal('prima', 18, 2)->default(0.00);

            $table->unique('tipo_carro', 'uq_apov_tipo_carro');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apov');
    }
};
