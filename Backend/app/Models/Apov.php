<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Apov extends Model
{
    protected $table = 'apov';
    public $timestamps = false;

    protected $fillable = [
        'tipo_carro',
        'tasa',
        'suma_asegurada',
        'prima',
    ];

    protected function casts(): array
    {
        return [
            'tasa' => 'decimal:4',
            'suma_asegurada' => 'decimal:2',
            'prima' => 'decimal:2',
        ];
    }

    public function coberturas(): HasMany
    {
        return $this->hasMany(ApovCobertura::class, 'apov_id');
    }
}
