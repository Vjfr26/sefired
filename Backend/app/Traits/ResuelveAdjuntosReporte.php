<?php

namespace App\Traits;

use App\Models\ClienteDocumento;

/**
 * Junta los adjuntos extra de una programación de reporte (interna o
 * externa): archivos sueltos subidos para ese reporte específico +
 * documentos ya existentes de clientes seleccionados (cliente_documentos).
 * Usado tanto al "Ejecutar ahora" (ReportController) como en el envío
 * automático programado (SendReportesProgramados).
 */
trait ResuelveAdjuntosReporte
{
    /** @return array<int, array{path: string, nombre: string, mime: ?string}> */
    private function resolverAdjuntosExtra($schedule): array
    {
        $adjuntos = [];

        foreach ((array) ($schedule->documentos_adicionales ?? []) as $doc) {
            if (!empty($doc['path']) && !empty($doc['nombre'])) {
                $adjuntos[] = ['path' => $doc['path'], 'nombre' => $doc['nombre'], 'mime' => $doc['mime'] ?? null];
            }
        }

        $clienteDocIds = (array) ($schedule->cliente_documento_ids ?? []);
        if (!empty($clienteDocIds)) {
            foreach (ClienteDocumento::whereIn('id', $clienteDocIds)->get() as $doc) {
                $adjuntos[] = ['path' => $doc->path, 'nombre' => $doc->nombre, 'mime' => $doc->mime];
            }
        }

        return $adjuntos;
    }

    /**
     * Adjunta a cada programación un campo `cliente_documentos_info` con
     * {id, nombre, cliente_nombre} de sus cliente_documento_ids, para que
     * el frontend pueda mostrar algo legible sin tener que resolver los
     * IDs por su cuenta tras recargar la página.
     */
    private function decorarConDocumentosInfo($programaciones)
    {
        $todosLosIds = $programaciones->flatMap(fn ($p) => (array) ($p->cliente_documento_ids ?? []))->unique()->values();
        $docs = $todosLosIds->isEmpty()
            ? collect()
            : ClienteDocumento::with('persona')->whereIn('id', $todosLosIds)->get()->keyBy('id');

        return $programaciones->map(function ($p) use ($docs) {
            $p->cliente_documentos_info = collect((array) ($p->cliente_documento_ids ?? []))
                ->map(fn ($id) => $docs->get($id))
                ->filter()
                ->map(fn ($d) => ['id' => $d->id, 'nombre' => $d->nombre, 'cliente_nombre' => $d->persona?->nombre ?? '—'])
                ->values();
            return $p;
        });
    }
}
