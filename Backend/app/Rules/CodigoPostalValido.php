<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** Solo dígitos — un código postal no debería admitir letras. */
class CodigoPostalValido implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) || trim($value) === '') {
            return;
        }

        if (!preg_match('/^\d{1,10}$/', trim($value))) {
            $fail('El campo :attribute solo puede contener números.');
        }
    }
}
