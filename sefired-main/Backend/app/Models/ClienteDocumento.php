<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ClienteDocumento extends Model
{
    protected $table = 'cliente_documentos';

    protected $fillable = [
        'cliente_id',
        'nombre',
        'path',
        'size',
        'mime',
    ];

    protected function casts(): array
    {
        return [
            'cliente_id' => 'integer',
            'size'       => 'integer',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
