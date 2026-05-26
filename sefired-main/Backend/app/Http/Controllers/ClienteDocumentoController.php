<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\ClienteDocumento;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Gestión de documentos del cliente (cédula, RIF, certificados, etc.).
 *
 * Los documentos se suben una vez y quedan en el perfil del cliente.
 * El simulador y el módulo de clientes los consultan para mostrar alertas de faltantes.
 *
 * Rutas (ver api.php):
 *   GET    /api/clientes/{id}/documentos        → lista documentos del cliente
 *   POST   /api/clientes/{id}/documentos        → subir nuevo documento
 *   DELETE /api/clientes/{id}/documentos/{docId}→ eliminar documento
 */
class ClienteDocumentoController extends Controller
{
    use LogsActivity;

    /** Lista todos los documentos del cliente con sus URLs de descarga. */
    public function index($clienteId)
    {
        $cliente = Cliente::findOrFail($clienteId);

        $docs = $cliente->documentos()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($d) => $this->row($d));

        return response()->json($docs);
    }

    /**
     * Sube un documento y lo asocia al cliente.
     * Acepta PDF, imágenes JPG/PNG y documentos Word/Excel.
     */
    public function store(Request $request, $clienteId)
    {
        Cliente::findOrFail($clienteId);

        $request->validate([
            'documento' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'nombre'    => 'required|string|max:100',
        ]);

        $file     = $request->file('documento');
        $filename = uniqid('cdoc_') . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs("clientes/{$clienteId}/documentos", $filename, 'public');

        $doc = ClienteDocumento::create([
            'cliente_id' => $clienteId,
            'nombre'     => trim($request->input('nombre')),
            'path'       => $path,
            'size'       => $file->getSize(),
            'mime'       => $file->getMimeType(),
        ]);

        $this->logActivity(
            'Documento Subido',
            "Doc \"{$doc->nombre}\" para cliente #{$clienteId}",
            'cliente_documentos',
            auth()->id()
        );

        return response()->json($this->row($doc), 201);
    }

    /** Elimina un documento del cliente y su archivo físico. */
    public function destroy($clienteId, $docId)
    {
        $doc = ClienteDocumento::where('cliente_id', $clienteId)->findOrFail($docId);

        Storage::disk('public')->delete($doc->path);
        $doc->delete();

        $this->logActivity(
            'Documento Eliminado',
            "Doc \"{$doc->nombre}\" del cliente #{$clienteId}",
            'cliente_documentos',
            auth()->id()
        );

        return response()->json(['message' => 'Documento eliminado correctamente']);
    }

    private function row(ClienteDocumento $d): array
    {
        return [
            'id'         => $d->id,
            'cliente_id' => $d->cliente_id,
            'nombre'     => $d->nombre,
            'path'       => $d->path,
            'url'        => Storage::disk('public')->url($d->path),
            'size'       => $d->size,
            'mime'       => $d->mime,
            'created_at' => $d->created_at?->format('d/m/Y H:i'),
        ];
    }
}
