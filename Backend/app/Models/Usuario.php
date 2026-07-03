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
        'genero',
        'cargo',
        'comision_pct',
        'nick',
        'password',
        'api_token',
        'token_expira_en',
        'token_created_at',
        'ultimo_visto',
        'sede',
        'nro_sede',
        'tipo',
        'permisos',
        'activo',
        'motivo_bloqueo',
        'temp',
        'temp_expira_en',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
        'token_expira_en',
        'token_created_at',
        'ultimo_visto',
        'temp',
        'temp_expira_en',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'comision_pct' => 'decimal:2',
            'permisos' => 'array',
            'temp' => 'boolean',
            'temp_expira_en'   => 'datetime',
            'token_created_at' => 'datetime',
            'token_expira_en'  => 'datetime',
            'ultimo_visto'     => 'datetime',
            'fecha_creacion'   => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sesiones()
    {
        return $this->hasMany(\App\Models\Sesion::class, 'usuario_id');
    }
}
