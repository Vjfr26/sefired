<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApovCobertura extends Model
{
    protected $table = 'apov_cobertura';
    public $timestamps = false;

    protected $fillable = [
        'apov_id',
        'tipo_cobertura',
        'tasa',
        'suma_bronze',
        'suma_plata',
        'suma_oro',
    ];

    protected function casts(): array
    {
        return [
            'apov_id' => 'integer',
            'tasa' => 'decimal:4',
            'suma_bronze' => 'decimal:2',
            'suma_plata' => 'decimal:2',
            'suma_oro' => 'decimal:2',
        ];
    }

    public function apov(): BelongsTo
    {
        return $this->belongsTo(Apov::class, 'apov_id');
    }
}
