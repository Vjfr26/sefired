<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Formato V-12345678 / E-12345678 / J-12345678-9 / G-20000000-0 / P-12345678
 * (letra de nacionalidad + dígitos, con guion verificador opcional para
 * RIF de empresas). Sin esto, la misma persona podía quedar duplicada en
 * la base con "V-12.345.678", "v12345678" y "V 12345678" como si fueran
 * tres cédulas distintas — ver Support\Documento::normalizarCedula(), que
 * normaliza el valor a un único formato antes de guardar/comparar.
 */
class CedulaValida implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) || trim($value) === '') {
            return;
        }

        if (!preg_match('/^[VEJGPvejgp]-?\d{6,9}(-?\d)?$/', trim($value))) {
            $fail('El campo :attribute debe tener el formato V-12345678 (o E/J/G/P), solo números después de la letra.');
        }
    }
}
