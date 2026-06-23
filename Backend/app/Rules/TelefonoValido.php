<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Solo dígitos, espacios, "+", "-" y paréntesis — formatos como
 * "0414-1234567" o "+58 414 1234567". Bloquea letras y símbolos que no
 * tienen sentido en un teléfono y que hoy pasaban sin ningún filtro.
 */
class TelefonoValido implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) || trim($value) === '') {
            return;
        }

        if (!preg_match('/^[0-9+\-()\s]{6,30}$/', trim($value))) {
            $fail('El campo :attribute solo puede contener números, espacios, "+", "-" y paréntesis.');
        }
    }
}
