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
        'sede',
        'nro_sede',
        'tipo',
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
            'temp' => 'boolean',
            'temp_expira_en' => 'datetime',
            'fecha_creacion' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
