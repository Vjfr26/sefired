<?php

namespace App\Http\Controllers;

use App\Models\SolicitudContacto;
use App\Rules\NoInjectionChars;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

/**
 * Solicitudes de contacto capturadas por el chatbot del portal público
 * (FrontEnd_Clientes). Hasta ahora PortalController::contacto() las creaba
 * pero no existía ninguna forma de verlas ni marcarlas como atendidas desde
 * el panel interno — quedaban como leads invisibles.
 */
class SolicitudContactoController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $noInjection = new NoInjectionChars();

        $request->validate([
            'status' => 'nullable|string|in:pendiente,atendido',
            'motivo' => ['nullable', 'string', 'max:30', $noInjection],
        ]);

        $query = SolicitudContacto::orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('motivo')) {
            $query->where('motivo', $request->motivo);
        }

        return response()->json(['data' => $query->limit(2000)->get()]);
    }

    /** Marca una solicitud de contacto como atendida (o la reabre). */
    public function update(Request $request, $id)
    {
        $solicitud = SolicitudContacto::findOrFail($id);

        $data = $request->validate([
            'status' => 'required|string|in:pendiente,atendido',
        ]);

        $solicitud->update($data);

        $this->logActivity(
            'Solicitud de Contacto Actualizada',
            "Solicitud #{$id} ({$solicitud->email}) → {$data['status']}",
            'solicitudes_contacto',
            auth()->id()
        );

        return response()->json($solicitud);
    }
}
