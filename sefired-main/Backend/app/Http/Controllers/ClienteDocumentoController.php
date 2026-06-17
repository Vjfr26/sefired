<?php

namespace App\Http\Controllers;

use App\Models\ClienteDocumento;
use App\Models\Persona;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClienteDocumentoController extends Controller
{
    use LogsActivity;

    public function index($personaId)
    {
        $persona = Persona::findOrFail($personaId);

        $docs = $persona->documentos()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($d) => $this->row($d));

        return response()->json($docs);
    }

    public function store(Request $request, $personaId)
    {
        Persona::findOrFail($personaId);

        $request->validate([
            'documento' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'nombre'    => 'required|string|max:100',
        ]);

        $file     = $request->file('documento');
        $filename = uniqid('cdoc_') . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs("clientes/{$personaId}/documentos", $filename, 'public');

        $doc = ClienteDocumento::create([
            'persona_id' => $personaId,
            'nombre'     => trim($request->input('nombre')),
            'path'       => $path,
            'size'       => $file->getSize(),
            'mime'       => $file->getMimeType(),
        ]);

        $this->logActivity(
            'Documento Subido',
            "Doc \"{$doc->nombre}\" para cliente #{$personaId}",
            'cliente_documentos',
            auth()->id()
        );

        return response()->json($this->row($doc), 201);
    }

    public function destroy($personaId, $docId)
    {
        $doc = ClienteDocumento::where('persona_id', $personaId)->findOrFail($docId);

        Storage::disk('public')->delete($doc->path);
        $doc->delete();

        $this->logActivity(
            'Documento Eliminado',
            "Doc \"{$doc->nombre}\" del cliente #{$personaId}",
            'cliente_documentos',
            auth()->id()
        );

        return response()->json(['message' => 'Documento eliminado correctamente']);
    }

    private function row(ClienteDocumento $d): array
    {
        return [
            'id'         => $d->id,
            'persona_id' => $d->persona_id,
            'nombre'     => $d->nombre,
            'path'       => $d->path,
            'url'        => Storage::disk('public')->url($d->path),
            'size'       => $d->size,
            'mime'       => $d->mime,
            'created_at' => $d->created_at?->format('d/m/Y H:i'),
        ];
    }
}
