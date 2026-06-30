<?php

namespace App\Http\Controllers;

use App\Mail\DocumentoClienteMail;
use App\Models\ClienteDocumento;
use App\Models\EmailLog;
use App\Models\Persona;
use App\Rules\NoInjectionChars;
use App\Support\PermisosPorRol;
use App\Traits\LogsActivity;
use App\Traits\ScopesVendedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class ClienteDocumentoController extends Controller
{
    use LogsActivity, ScopesVendedor;

    /**
     * Un usuario con capacidad de vender (cotizaciones.create/emit) puede
     * ver/subir/asociar documentos del cliente al que le emite, sea suyo o de
     * otro vendedor — parte del flujo de emisión de una nueva póliza. Los
     * roles de pura gestión (sin permiso de cotizar) siguen restringidos a sus
     * propios clientes.
     */
    private function puedeVender(): bool
    {
        $user = auth()->user();
        return $user && (
            PermisosPorRol::tiene($user, 'cotizaciones', 'create')
            || PermisosPorRol::tiene($user, 'cotizaciones', 'emit')
        );
    }

    public function index($personaId)
    {
        $persona = Persona::findOrFail($personaId);
        $this->assertAccesoCliente($persona, $this->puedeVender());

        $docs = $persona->documentos()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($d) => $this->row($d));

        return response()->json($docs);
    }

    public function store(Request $request, $personaId)
    {
        $persona = Persona::findOrFail($personaId);
        $this->assertAccesoCliente($persona, $this->puedeVender());

        $noInjection = new NoInjectionChars();

        $request->validate([
            'documento' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'nombre'    => ['required', 'string', 'max:100', $noInjection],
        ]);

        $file     = $request->file('documento');
        $filename = uniqid('cdoc_') . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs("clientes/{$personaId}/documentos", $filename, config('filesystems.docs_disk'));

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
        $persona = Persona::findOrFail($personaId);
        $this->assertAccesoCliente($persona, $this->puedeVender());

        Storage::disk(config('filesystems.docs_disk'))->delete($doc->path);
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
            'url'        => Storage::disk(config('filesystems.docs_disk'))->url($d->path),
            'size'       => $d->size,
            'mime'       => $d->mime,
            'created_at' => $d->created_at?->format('d/m/Y H:i'),
        ];
    }
}
