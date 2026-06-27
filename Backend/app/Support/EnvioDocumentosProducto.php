<?php

namespace App\Support;

use App\Mail\ProductoDocumentosMail;
use App\Models\EmailLog;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\ProductoDocumentoEnvio;
use Illuminate\Support\Facades\Mail;

/**
 * Envío de los documentos de un producto (tipo de póliza) a los clientes,
 * adjuntos por correo, con control de "ya enviado" para no duplicar.
 *
 * Casos:
 *  - Cliente nuevo (al emitir/renovar): recibe todos los documentos del producto.
 *  - Documento nuevo en un producto: se envía a los clientes con póliza ACTIVA
 *    de ese producto que aún no lo tengan.
 */
class EnvioDocumentosProducto
{
    /**
     * Envía a la persona los documentos del producto que aún no ha recibido y
     * registra el envío. No hace nada si no hay correo, no hay documentos, o ya
     * los recibió todos. Nunca lanza: ante un fallo deja registro en EmailLog.
     */
    public static function paraPersona(Persona $persona, Producto $producto, ?int $polizaId = null): void
    {
        $docs = $producto->documentos ?? [];
        if (empty($docs) || empty($persona->correo)) {
            return;
        }

        $yaEnviados = ProductoDocumentoEnvio::where('producto_id', $producto->id)
            ->where('persona_id', $persona->id)
            ->pluck('doc_path')
            ->all();

        $pendientes = array_values(array_filter(
            $docs,
            fn ($d) => !empty($d['path']) && !in_array($d['path'], $yaEnviados, true)
        ));

        if (empty($pendientes)) {
            return;
        }

        try {
            Mail::to($persona->correo)->queue(new ProductoDocumentosMail($persona, $producto, $pendientes));

            foreach ($pendientes as $d) {
                ProductoDocumentoEnvio::create([
                    'producto_id' => $producto->id,
                    'doc_path'    => $d['path'],
                    'persona_id'  => $persona->id,
                    'poliza_id'   => $polizaId,
                    'enviado_en'  => now(),
                ]);
            }

            EmailLog::registrar(
                'producto_documentos',
                $persona->correo,
                'Documentos de ' . $producto->nombre . ' (' . count($pendientes) . ')',
                $persona->id,
                $polizaId
            );
        } catch (\Throwable $e) {
            EmailLog::registrar(
                'producto_documentos',
                $persona->correo,
                'Documentos de ' . $producto->nombre,
                $persona->id,
                $polizaId,
                'error',
                $e->getMessage()
            );
        }
    }

    /**
     * Reparte un producto a todos los clientes con póliza ACTIVA de ese producto
     * que aún no tengan todos sus documentos (usado al subir un documento nuevo).
     * Cada persona recibe solo lo que le falte.
     */
    public static function aClientesDelProducto(Producto $producto): int
    {
        if (empty($producto->documentos)) {
            return 0;
        }

        $personas = Poliza::where('producto_id', $producto->id)
            ->where('status', 'ACTIVA')
            ->with('solicitud.persona')
            ->get()
            ->map(fn (Poliza $p) => [$p->solicitud?->persona, $p->id])
            ->filter(fn ($par) => $par[0] !== null)
            ->unique(fn ($par) => $par[0]->id);

        foreach ($personas as $par) {
            self::paraPersona($par[0], $producto, $par[1]);
        }

        return $personas->count();
    }
}
