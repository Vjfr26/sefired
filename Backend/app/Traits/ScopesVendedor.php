<?php

namespace App\Traits;

use App\Models\Persona;
use App\Support\PermisosPorRol;

/**
 * Un vendedor (Vendedor Sucursal/Calle) solo puede ver u operar sobre SUS
 * propios clientes (vendedor_id == su id, o sin asignar todavía).
 * Admin/Oficina no tienen restricción. Se usa tanto para filtrar listados
 * (whereVendedorPropio) como para cortar con 403 el acceso directo por ID
 * a un registro de otro vendedor (protección IDOR).
 *
 * Un vendedor con el permiso explícito `clientes.view_all` (asignable desde
 * Usuarios → Permisos) deja de estar restringido, igual que Admin/Oficina.
 */
trait ScopesVendedor
{
    private function esRolRestringido(): bool
    {
        $user = auth()->user();
        if (!$user) {
            return true;
        }
        if (in_array($user->tipo, ['Admin', 'Oficina'], true)) {
            return false;
        }
        return !PermisosPorRol::tiene($user, 'clientes', 'view_all');
    }

    /** Aplica el filtro de vendedor propio a un query sobre la tabla persona. */
    protected function whereVendedorPropio($query)
    {
        if ($this->esRolRestringido()) {
            $user = auth()->user();
            $query->where(function ($q) use ($user) {
                $q->where('vendedor_id', $user->id)->orWhereNull('vendedor_id');
            });
        }
        return $query;
    }

    /** Corta la petición con 403 si el cliente indicado no pertenece al vendedor actual. */
    protected function assertAccesoCliente(Persona $persona): void
    {
        $this->assertAccesoVendedorId($persona->vendedor_id, 'No tienes acceso a este cliente.');
    }

    /**
     * Versión genérica: corta con 403 si el vendedor_id dado (de una
     * Solicitud, Poliza, etc.) no pertenece al usuario actual. Sin
     * vendedor_id asignado se permite (registro huérfano/heredado).
     */
    protected function assertAccesoVendedorId(?int $vendedorId, string $mensaje = 'No tienes acceso a este registro.'): void
    {
        if ($this->esRolRestringido()) {
            $user = auth()->user();
            if ($vendedorId && $vendedorId !== $user->id) {
                abort(403, $mensaje);
            }
        }
    }
}
