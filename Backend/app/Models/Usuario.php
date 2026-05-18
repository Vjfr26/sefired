<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'usuarios';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'cargo',
        'nick',
        'password',
        'api_token',
        'sede',
        'nro_sede',
        'tipo',
        'permisos',
        'activo',
        'temp',
        'temp_expira_en',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'permisos' => 'array',
            'temp' => 'boolean',
            'temp_expira_en' => 'datetime',
            'fecha_creacion' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
