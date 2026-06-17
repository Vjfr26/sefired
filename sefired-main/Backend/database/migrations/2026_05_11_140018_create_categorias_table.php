<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre_producto', 30);
            $table->string('categoria', 50);
            $table->string('dependencia', 50);
            $table->decimal('tasa', 10, 4)->default(0.0000);

            $table->unique(['nombre_producto', 'categoria', 'dependencia'], 'uq_categorias');
            $table->index('nombre_producto', 'idx_categorias_producto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias');
    }
};
