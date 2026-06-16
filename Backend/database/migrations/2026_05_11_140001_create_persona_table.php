<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('persona', function (Blueprint $table) {
            $table->increments('id');
            $table->string('cedula', 20)->unique('uq_persona_cedula');
            $table->string('nombre', 120);
            $table->string('telefono', 20)->nullable();
            $table->string('celular', 20)->nullable();
            $table->string('correo', 100)->nullable();
            $table->text('direccion')->nullable();
            $table->string('codigo_postal', 10)->nullable();
            $table->string('nacionalidad', 30)->nullable();
            $table->string('estado', 70)->nullable();
            $table->string('ciudad', 60)->nullable();
            $table->date('nacimiento')->nullable();
            $table->string('sexo', 15)->nullable();
            $table->string('condicion', 40)->nullable();
            $table->string('profesion', 50)->nullable();
            $table->string('actividad', 50)->nullable();
            $table->string('archivo', 200)->nullable();
            $table->dateTime('fecha_creacion')->useCurrent();

            $table->index('nombre', 'idx_persona_nombre');
            $table->index('correo', 'idx_persona_correo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('persona');
    }
};
