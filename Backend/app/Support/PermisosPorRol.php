<?php

namespace App\Support;

/**
 * Permisos por defecto de cada rol — espejo de PERMISOS_POR_ROL en
 * FrontEnd_Interno/src/utils/helpers.jsx. DEBE mantenerse sincronizado
 * a mano con ese archivo; si se agrega o quita un permiso ahí, hay que
 * replicarlo aquí.
 *
 * `permisos` en la tabla `usuarios` es NULL/vacío a propósito cuando el
 * usuario no tiene permisos personalizados — en ese caso se le aplican
 * los permisos de su rol calculados aquí (igual que ya hace el frontend
 * en getEffectivePermsObj). Por eso el cambio de rol (ChangeRoleModal)
 * resetea `permisos` a null: vuelve a heredar del rol nuevo.
 */
class PermisosPorRol
{
    private const TABLA = [
        'Admin' => [
            'home'         => ['view'],
            'clientes'     => ['view', 'view_cards', 'view_list', 'view_all', 'reasignar', 'create', 'edit', 'delete', 'block', 'view_polizas', 'view_facturas', 'view_docs', 'renew', 'adjust', 'manage_beneficiarios', 'manage_bienes'],
            'vehiculos'    => ['view', 'view_cards', 'view_list', 'view_poliza', 'view_docs', 'edit', 'delete'],
            'cotizaciones' => ['view', 'view_list', 'create', 'edit', 'delete', 'emit', 'underwrite'],
            'productos'    => ['view', 'view_cards', 'view_list', 'create', 'edit', 'delete', 'manage_docs', 'manage_beneficios'],
            'tasas'        => ['view', 'view_cards', 'view_list', 'create', 'edit', 'delete'],
            'usuarios'     => ['view', 'view_cards', 'view_list', 'create', 'edit', 'delete', 'block', 'perms', 'change_role'],
            'reportes'     => ['view', 'export', 'manage_leads', 'manage_schedules', 'manage_comisiones', 'manage_oficinas', 'revertir_comisiones', 'view_ventas', 'view_ventas_todos', 'view_oficinas', 'view_metrics_personal', 'view_metrics_personal_todos', 'view_metrics_clientes', 'view_metrics_vehiculos', 'view_leads', 'view_externos'],
            'config'       => ['view', 'change_password', 'view_audit', 'view_email_logs', 'manage_security'],
        ],
        'Oficina' => [
            'home'         => ['view'],
            'clientes'     => ['view', 'view_cards', 'view_list', 'view_all', 'reasignar', 'create', 'edit', 'delete', 'block', 'view_polizas', 'view_facturas', 'view_docs', 'renew', 'adjust', 'manage_beneficiarios', 'manage_bienes'],
            'vehiculos'    => ['view', 'view_cards', 'view_list', 'view_poliza', 'view_docs', 'edit'],
            'cotizaciones' => ['view', 'view_list', 'create', 'edit', 'emit', 'underwrite'],
            'productos'    => ['view', 'view_cards', 'view_list'],
            'tasas'        => ['view', 'view_cards', 'view_list'],
            'reportes'     => ['view', 'export', 'manage_leads', 'manage_comisiones', 'manage_oficinas', 'view_ventas', 'view_ventas_todos', 'view_oficinas', 'view_metrics_personal', 'view_metrics_personal_todos', 'view_metrics_clientes', 'view_metrics_vehiculos', 'view_leads', 'view_externos'],
            'config'       => ['view', 'change_password'],
        ],
        'Vendedor Sucursal' => [
            'home'         => ['view'],
            'clientes'     => ['view', 'view_cards', 'view_list', 'create', 'view_polizas', 'view_facturas', 'view_docs'],
            'vehiculos'    => ['view', 'view_cards', 'view_list', 'view_poliza'],
            'cotizaciones' => ['view', 'view_list', 'create'],
            'productos'    => ['view', 'view_cards', 'view_list'],
            'tasas'        => ['view', 'view_cards', 'view_list'],
            'reportes'     => ['view', 'view_ventas', 'view_metrics_personal'],
            'config'       => ['view', 'change_password'],
        ],
        'Vendedor Calle' => [
            'home'         => ['view'],
            'clientes'     => ['view', 'view_cards', 'view_list', 'create', 'view_polizas'],
            'vehiculos'    => ['view', 'view_cards', 'view_list'],
            'cotizaciones' => ['view', 'view_list', 'create'],
            'productos'    => ['view', 'view_cards', 'view_list'],
            'tasas'        => ['view', 'view_cards', 'view_list'],
            'reportes'     => ['view', 'view_ventas', 'view_metrics_personal'],
            'config'       => ['view', 'change_password'],
        ],
    ];

    /** @return array<string, array<string>> */
    public static function paraRol(?string $tipo): array
    {
        return self::TABLA[$tipo] ?? ['home' => ['view']];
    }

    /**
     * Permisos efectivos de un usuario: los suyos personalizados si los
     * tiene, o si no, los de su rol. Misma regla que getEffectivePermsObj
     * en el frontend — centralizado aquí para no repetir el fallback en
     * cada middleware/trait que necesite consultar permisos.
     */
    public static function efectivos(?\App\Models\Usuario $user): array
    {
        if (!$user) {
            return [];
        }
        $permisos = $user->permisos;
        return empty($permisos) ? self::paraRol($user->tipo) : $permisos;
    }

    /** Atajo: ¿tiene el usuario la acción $action habilitada en el módulo $module? */
    public static function tiene(?\App\Models\Usuario $user, string $module, string $action): bool
    {
        $permisos = self::efectivos($user);
        return in_array($action, $permisos[$module] ?? [], true);
    }
}
