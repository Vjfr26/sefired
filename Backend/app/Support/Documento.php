<?php

namespace App\Support;

/**
 * Normalización de cédula/RIF a un único formato canónico (LETRA-DIGITOS)
 * antes de guardar o comparar — evita que la misma persona quede duplicada
 * por escribir "V-12.345.678", "v12345678" o "V 12345678" de formas distintas.
 */
class Documento
{
    public static function normalizarCedula(?string $valor): ?string
    {
        $limpio = self::soloAlfanumerico($valor);
        if ($limpio === null || $limpio === '') {
            return $valor;
        }

        if (preg_match('/^([VEJGP])(\d+)$/', $limpio, $m)) {
            return $m[1] . '-' . $m[2];
        }

        return $limpio;
    }

    /** Solo letras/dígitos en mayúsculas, sin separadores — para comparar contra columnas ya normalizadas con REPLACE() en SQL. */
    public static function soloAlfanumerico(?string $valor): ?string
    {
        if ($valor === null || trim($valor) === '') {
            return $valor;
        }

        return strtoupper(preg_replace('/[^A-Z0-9]/i', '', trim($valor)));
    }

    /** Solo dígitos — para comparar teléfonos sin importar el formato con que se escribieron. */
    public static function soloDigitos(?string $valor): ?string
    {
        if ($valor === null || trim($valor) === '') {
            return $valor;
        }

        return preg_replace('/\D/', '', $valor);
    }
}
