<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Usuario>
 */
class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    public function definition(): array
    {
        return [
            'nombre'           => fake()->name(),
            'genero'           => fake()->randomElement(['M', 'F']),
            'cargo'            => 'Ejecutivo de Cuenta',
            'nick'             => fake()->unique()->userName(),
            'password'         => Hash::make('password123'),
            'sede'             => 'Principal',
            'nro_sede'         => 1,
            'tipo'             => 'Oficina',
            'permisos'         => null,
            'activo'           => true,
            'motivo_bloqueo'   => null,
            'temp'             => false,
            'temp_expira_en'   => null,
            'api_token'        => null,
            'token_expira_en'  => null,
            'token_created_at' => null,
        ];
    }

    /** Usuario con rol Administrador. */
    public function admin(): static
    {
        return $this->state(['tipo' => 'Admin']);
    }

    /** Usuario con token activo (sesión iniciada). */
    public function withToken(): static
    {
        $token = bin2hex(random_bytes(40));
        return $this->state([
            'api_token'        => $token,
            'token_expira_en'  => now()->addHours(8),
            'token_created_at' => now(),
        ]);
    }

    /** Usuario desactivado. */
    public function inactive(): static
    {
        return $this->state(['activo' => false]);
    }
}
