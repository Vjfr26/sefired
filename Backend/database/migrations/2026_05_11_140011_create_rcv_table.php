<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rcv', function (Blueprint $table) {
            $table->increments('id');
            $table->string('producto', 30);
            $table->string('categoria', 70);
            $table->string('dependencia', 50);
            $table->decimal('tasa_cosa', 10, 4)->default(0.0000);
            $table->decimal('tasa_personas', 10, 4)->default(0.0000);
            $table->decimal('tasa_prima', 10, 4)->default(0.0000);
            $table->decimal('suma_persona', 18, 2)->default(0.00);
            $table->decimal('suma_cosa', 18, 2)->default(0.00);
            $table->decimal('suma_prima', 18, 2)->default(0.00);
            $table->decimal('prima_anual', 18, 2)->default(0.00);

            $table->unique(['producto', 'categoria', 'dependencia'], 'uq_rcv');
            $table->index('producto', 'idx_rcv_producto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rcv');
    }
};
