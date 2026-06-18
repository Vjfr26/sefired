<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rechaza comillas, punto y coma, backtick, < >, backslash y "--" en campos
 * de texto libre. Eloquent ya parametriza todas las consultas (no hay riesgo
 * real de inyección SQL), pero esta regla aplica la misma política explícita
 * que el frontend (sanitizeInput()) también en el backend, que es el único
 * punto que no se puede saltar enviando la petición directamente a la API.
 */
class NoInjectionChars implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        if (preg_match('/[\'";`<>\\\\]/', $value) || str_contains($value, '--')) {
            $fail('El campo :attribute contiene caracteres no permitidos.');
        }
    }
}
