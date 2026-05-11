<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $table = 'categorias';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'nombre_producto',
        'categoria',
        'dependencia',
        'tasa',
    ];

    protected function casts(): array
    {
        return [
            'tasa' => 'decimal:4',
        ];
    }
}
