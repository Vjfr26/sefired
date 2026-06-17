<?php

namespace App\Http\Controllers;

use App\Mail\DocumentoClienteMail;
use App\Models\ClienteDocumento;
use App\Models\EmailLog;
use App\Models\Persona;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
        $persona = Persona::findOrFail($personaId);

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

        if ($persona->correo) {
            try {
                Mail::to($persona->correo)->queue(new DocumentoClienteMail($persona->nombre, $doc->nombre, 'subido'));
                EmailLog::registrar('documento_subido', $persona->correo, 'Nuevo documento en su expediente', $persona->id);
            } catch (\Throwable) {}
        }

        return response()->json($this->row($doc), 201);
    }

    public function destroy($personaId, $docId)
    {
        $doc     = ClienteDocumento::where('persona_id', $personaId)->findOrFail($docId);
        $persona = Persona::find($personaId);

        Storage::disk('public')->delete($doc->path);
        $docNombre = $doc->nombre;
        $doc->delete();

        $this->logActivity(
            'Documento Eliminado',
            "Doc \"{$docNombre}\" del cliente #{$personaId}",
            'cliente_documentos',
            auth()->id()
        );

        if ($persona?->correo) {
            try {
                Mail::to($persona->correo)->queue(new DocumentoClienteMail($persona->nombre, $docNombre, 'eliminado'));
                EmailLog::registrar('documento_eliminado', $persona->correo, 'Documento eliminado de su expediente', $persona->id);
            } catch (\Throwable) {}
        }

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
