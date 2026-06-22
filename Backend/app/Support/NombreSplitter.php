<?php

namespace App\Support;

class NombreSplitter
{
    /**
     * Separa un nombre completo venezolano en nombres/apellidos, asumiendo
     * la convención de 2 nombres + 2 apellidos cuando hay 4+ palabras, con
     * reglas de respaldo para 1-3 palabras.
     */
    public static function partes(?string $nombreCompleto): array
    {
        $parts = array_values(array_filter(explode(' ', trim(preg_replace('/\s+/', ' ', $nombreCompleto ?? '')))));
        $count = count($parts);

        $primerNombre = $segundoNombre = $primerApellido = $segundoApellido = '';

        if ($count === 1) {
            $primerNombre = $parts[0];
        } elseif ($count === 2) {
            $primerNombre = $parts[0];
            $primerApellido = $parts[1];
        } elseif ($count === 3) {
            $primerNombre = $parts[0];
            $primerApellido = $parts[1];
            $segundoApellido = $parts[2];
        } elseif ($count >= 4) {
            $primerNombre = $parts[0];
            $segundoNombre = $parts[1];
            $primerApellido = $parts[2];
            $segundoApellido = implode(' ', array_slice($parts, 3));
        }

        return [
            'nombres'   => trim("{$primerNombre} {$segundoNombre}"),
            'apellidos' => trim("{$primerApellido} {$segundoApellido}"),
        ];
    }
}
