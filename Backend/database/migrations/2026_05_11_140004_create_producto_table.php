<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->decimal('cobertura', 18, 2)->default(0.00);
            $table->decimal('prima', 18, 2)->default(0.00);
            $table->string('moneda', 10)->default('USD');

            $table->index('nombre', 'idx_producto_nombre');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto');
    }
};
