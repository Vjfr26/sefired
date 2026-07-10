<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `producto.tipo` (el ramo) deja de ser un catálogo cerrado: el modal de
 * "Nuevo tipo de póliza" permite escribir un ramo nuevo (p.ej. "grua") en
 * vez de obligar a elegir uno del ENUM. Se convierte a VARCHAR(20) — el
 * mismo largo que `poliza.tipo`, adonde se copia el ramo al emitir.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE producto MODIFY tipo VARCHAR(20) NOT NULL DEFAULT 'otro'");
    }

    public function down(): void
    {
        // Al volver al catálogo cerrado, los ramos personalizados caen en 'otro'.
        DB::statement("UPDATE producto SET tipo = 'otro' WHERE tipo NOT IN ('rcv','apov','alpd','ec','ep','vida','salud','hogar','accidentes','funeraria')");
        DB::statement("ALTER TABLE producto MODIFY tipo ENUM('rcv','apov','alpd','ec','ep','vida','salud','hogar','accidentes','funeraria','otro') NOT NULL DEFAULT 'otro'");
    }
};
