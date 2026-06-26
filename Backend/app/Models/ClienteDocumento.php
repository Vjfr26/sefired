<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ClienteDocumento extends Model
{
    protected $table = 'cliente_documentos';

    protected $fillable = [
        'persona_id',
        'nombre',
        'path',
        'size',
        'mime',
    ];

    protected function casts(): array
    {
        return [
            'persona_id' => 'integer',
            'size'       => 'integer',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk(config('filesystems.docs_disk'))->url($this->path);
    }
}
