<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Registro de qué documento de un producto (por su ruta) ya se envió a cada
 * cliente, para no duplicar envíos. Ver App\Support\EnvioDocumentosProducto.
 */
class ProductoDocumentoEnvio extends Model
{
    protected $table = 'producto_documento_envio';

    public $timestamps = false;

    protected $fillable = [
        'producto_id',
        'doc_path',
        'persona_id',
        'poliza_id',
        'enviado_en',
    ];

    protected function casts(): array
    {
        return ['enviado_en' => 'datetime'];
    }
}
