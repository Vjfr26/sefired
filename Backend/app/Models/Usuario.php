<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'nro_vendedor',
    'nombre',
    'cargo',
    'nick',
    'pass',
    'sede',
    'nro_sede',
    'tipo',
    'activo',
    'temp',
    'temp_expira_en'
])]
#[Hidden(['pass', 'remember_token'])]
class Usuario extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $primaryKey = 'nro_vendedor';
    public $timestamps = false;

    public function getAuthPassword()
    {
        return $this->pass;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'temp' => 'boolean',
            'temp_expira_en' => 'datetime',
            'fecha_creacion' => 'datetime',
            'pass' => 'hashed',
        ];
    }
}
