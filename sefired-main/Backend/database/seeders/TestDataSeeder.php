<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Usuario;
use App\Models\Producto;
use App\Models\Tarifario;
use App\Models\Cliente;
use App\Models\Vehiculo;
use App\Models\Solicitud;
use App\Models\Poliza;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a Product if not exists
        $producto = Producto::updateOrCreate(
            ['id' => 1],
            [
                'codigo' => 'RCV-001',
                'nombre' => 'Vehículo Particular RCV',
                'tipo' => 'rcv',
                'cobertura' => 15000.00,
                'tipo_calculo' => 'fijo',
                'descripcion' => 'Responsabilidad Civil Vehicular básica',
                'requiere_vehiculo' => true
            ]
        );

        $producto2 = Producto::updateOrCreate(
            ['id' => 2],
            [
                'codigo' => 'RCV-002',
                'nombre' => 'Vehículo Comercial',
                'tipo' => 'rcv',
                'cobertura' => 25000.00,
                'tipo_calculo' => 'fijo',
                'descripcion' => 'Responsabilidad Civil para vehículos comerciales',
                'requiere_vehiculo' => true
            ]
        );

        // 2. Create a Tarifario if not exists
        $tarifario = Tarifario::updateOrCreate(
            ['id' => 1],
            [
                'producto_id' => 1,
                'nombre' => 'Tarifario General 2026',
                'version' => '1.0',
                'activo' => true,
                'datos' => ['tasa' => 38.54]
            ]
        );

        // 3. Create brand/model entries
        $toyota = DB::table('modelo_vehiculo')->where('marca', 'TOYOTA')->where('modelo', 'COROLLA')->first();
        $toyotaId = $toyota ? $toyota->id : DB::table('modelo_vehiculo')->insertGetId(['marca' => 'TOYOTA', 'modelo' => 'COROLLA']);
        
        $chevrolet = DB::table('modelo_vehiculo')->where('marca', 'CHEVROLET')->where('modelo', 'AVEO')->first();
        $chevroletId = $chevrolet ? $chevrolet->id : DB::table('modelo_vehiculo')->insertGetId(['marca' => 'CHEVROLET', 'modelo' => 'AVEO']);
        
        $ford = DB::table('modelo_vehiculo')->where('marca', 'FORD')->where('modelo', 'FIESTA')->first();
        $fordId = $ford ? $ford->id : DB::table('modelo_vehiculo')->insertGetId(['marca' => 'FORD', 'modelo' => 'FIESTA']);

        // 4. Create Personas and Clientes
        $personas = [
            [
                'cedula' => 'V-4961881',
                'nombre' => 'ODILA ELVIRA GONZALEZ DE CAMACHO',
                'telefono' => '02432321122',
                'celular' => '04268440836',
                'correo' => 'odilaelvirag@gmail.com',
                'direccion' => 'PAMPAN ESTADO TRUJILLO',
                'nacionalidad' => 'Venezolano',
                'estado' => 'TRUJILLO',
                'ciudad' => 'BOCONO',
                'nacimiento' => '1957-01-25',
                'sexo' => 'Femenino'
            ],
            [
                'cedula' => 'V-12345678',
                'nombre' => 'PEDRO JOSE SALAZAR',
                'telefono' => '02129998877',
                'celular' => '04121234567',
                'correo' => 'pedros@gmail.com',
                'direccion' => 'AV. FRANCISCO DE MIRANDA, CHACAO',
                'nacionalidad' => 'Venezolano',
                'estado' => 'MIRANDA',
                'ciudad' => 'CARACAS',
                'nacimiento' => '1985-05-12',
                'sexo' => 'Masculino'
            ],
            [
                'cedula' => 'V-87654321',
                'nombre' => 'ANA MARIA SUAREZ',
                'telefono' => '02418887766',
                'celular' => '04147654321',
                'correo' => 'anas@gmail.com',
                'direccion' => 'AV. BOLIVAR NORTE, VALENCIA',
                'nacionalidad' => 'Venezolano',
                'estado' => 'CARABOBO',
                'ciudad' => 'VALENCIA',
                'nacimiento' => '1990-09-20',
                'sexo' => 'Femenino'
            ]
        ];

        foreach ($personas as $p) {
            $existing = DB::table('persona')->where('cedula', $p['cedula'])->first();
            if ($existing) {
                $personaId = $existing->id;
            } else {
                $personaId = DB::table('persona')->insertGetId($p);
            }
            
            $cliente = Cliente::updateOrCreate(['persona_id' => $personaId]);

            // 5. Create Vehiculo for each client
            if ($p['cedula'] === 'V-4961881') {
                Vehiculo::updateOrCreate(
                    ['placa' => 'AA111BB'],
                    [
                        'cliente_id' => $cliente->id,
                        'fecha_adquisicion' => '2020-01-01',
                        'modelo_vehiculo_id' => $toyotaId,
                        'clase' => 'PASEO',
                        'tipo' => 'SEDAN',
                        'anio' => 2015,
                        'uso' => 'PARTICULAR',
                        'color' => 'PLATA',
                        'puestos' => 5,
                        'serial_carroceria' => '8Y1AB23C4DE567890',
                        'serial_motor' => '1ZZ-1234567'
                    ]
                );
            } elseif ($p['cedula'] === 'V-12345678') {
                Vehiculo::updateOrCreate(
                    ['placa' => 'CC222DD'],
                    [
                        'cliente_id' => $cliente->id,
                        'fecha_adquisicion' => '2021-06-15',
                        'modelo_vehiculo_id' => $chevroletId,
                        'clase' => 'PASEO',
                        'tipo' => 'HATCHBACK',
                        'anio' => 2012,
                        'uso' => 'PARTICULAR',
                        'color' => 'AZUL',
                        'puestos' => 5,
                        'serial_carroceria' => '8Y1AB23C4DE567891',
                        'serial_motor' => 'F16D3-123456'
                    ]
                );
            } else {
                Vehiculo::updateOrCreate(
                    ['placa' => 'EE333FF'],
                    [
                        'cliente_id' => $cliente->id,
                        'fecha_adquisicion' => '2022-10-10',
                        'modelo_vehiculo_id' => $fordId,
                        'clase' => 'PASEO',
                        'tipo' => 'SEDAN',
                        'anio' => 2014,
                        'uso' => 'PARTICULAR',
                        'color' => 'BLANCO',
                        'puestos' => 5,
                        'serial_carroceria' => '8Y1AB23C4DE567892',
                        'serial_motor' => 'SIGMA-123456'
                    ]
                );
            }
        }

        // 6. Create Vendedores (Usuarios)
        $vendedoresData = [
            ['nombre' => 'Pedro Salazar',  'nick' => 'pedro',  'cargo' => 'Agente',     'sede' => 'Valencia',  'nro_sede' => 2],
            ['nombre' => 'Ana Suárez',     'nick' => 'ana',    'cargo' => 'Agente',     'sede' => 'Caracas',   'nro_sede' => 1],
            ['nombre' => 'Luis Romero',    'nick' => 'luis',   'cargo' => 'Agente',     'sede' => 'Caracas',   'nro_sede' => 1],
            ['nombre' => 'Carla Mendoza',  'nick' => 'carla',  'cargo' => 'Agente',     'sede' => 'Maracaibo', 'nro_sede' => 3],
            ['nombre' => 'Rosa Control',   'nick' => 'rosa',   'cargo' => 'Supervisor', 'sede' => 'Caracas',   'nro_sede' => 1],
        ];

        $vendedores = [];
        foreach ($vendedoresData as $vd) {
            $vendedores[$vd['nombre']] = Usuario::updateOrCreate(
                ['nick' => $vd['nick']],
                [
                    'nombre' => $vd['nombre'],
                    'cargo' => $vd['cargo'],
                    'password' => bcrypt('secret'),
                    'sede' => $vd['sede'],
                    'nro_sede' => $vd['nro_sede'],
                    'tipo' => $vd['cargo'] === 'Supervisor' ? 'Supervisor' : 'Vendedor',
                    'activo' => true,
                    'fecha_creacion' => now()
                ]
            );
        }

        // 7. Create Solicitudes and Polizas mapping exactly to the report details
        $clientes = Cliente::with('persona')->get();
        $c1 = $clientes[0];
        $c2 = $clientes[1];
        $c3 = $clientes[2];

        $policiesData = [
            [
                'contrato' => 'SEF-2026-VEH-00848',
                'cliente' => $c1,
                'vendedor' => $vendedores['Pedro Salazar'],
                'producto' => $producto,
                'total' => 532.50,
                'emision' => '2026-05-02',
                'pago' => 'Contado',
                'tipo' => 'Individual',
                'status' => 'ACTIVA'
            ],
            [
                'contrato' => 'SEF-2026-VEH-00847',
                'cliente' => $c2,
                'vendedor' => $vendedores['Ana Suárez'],
                'producto' => $producto,
                'total' => 714.20,
                'emision' => '2026-05-01',
                'pago' => 'Financiado',
                'tipo' => 'Individual',
                'status' => 'ACTIVA'
            ],
            [
                'contrato' => 'SEF-2026-VEH-00846',
                'cliente' => $c3,
                'vendedor' => $vendedores['Luis Romero'],
                'producto' => $producto2,
                'total' => 1240.00,
                'emision' => '2026-04-30',
                'pago' => 'Contado',
                'tipo' => 'Individual',
                'status' => 'ACTIVA'
            ],
            [
                'contrato' => 'SEF-2026-VEH-00845',
                'cliente' => $c1,
                'vendedor' => $vendedores['Carla Mendoza'],
                'producto' => $producto,
                'total' => 487.00,
                'emision' => '2026-04-29',
                'pago' => 'Contado',
                'tipo' => 'Individual',
                'status' => 'ACTIVA'
            ],
            [
                'contrato' => 'SEF-2026-VEH-00844',
                'cliente' => $c2,
                'vendedor' => $vendedores['Pedro Salazar'],
                'producto' => $producto,
                'total' => 350.00,
                'emision' => '2026-04-25',
                'pago' => 'Contado',
                'tipo' => 'Individual',
                'status' => 'ANULADA'
            ],
        ];

        foreach ($policiesData as $pData) {
            $cli = $pData['cliente'];
            $veh = Vehiculo::where('cliente_id', $cli->id)->first();
            $prod = $pData['producto'];
            $totalUsd = $pData['total'];
            $totalBs = $totalUsd * 38.54;

            $solicitud = Solicitud::updateOrCreate(
                ['cliente_id' => $cli->id, 'placa' => $veh->placa, 'producto_id' => $prod->id],
                [
                    'tarifario_id' => $tarifario->id,
                    'total' => $totalUsd,
                    'total_bs' => $totalBs,
                    'suma_cobertura_bs' => $prod->cobertura * 38.54,
                    'suma_prima_bs' => $totalBs,
                    'fecha_solicitud' => $pData['emision'],
                    'status' => 'Emitida',
                    'vendedor_id' => $pData['vendedor']->id,
                    'coberturas' => [
                        'tasaBCV' => 38.54,
                        'coberturas' => [],
                        'total_usd' => $totalUsd,
                        'total_bs' => $totalBs
                    ],
                    'nombre_tomador' => $cli->persona->nombre,
                    'ci_tomador' => $cli->persona->cedula,
                    'asegurado_nombre' => $cli->persona->nombre,
                    'asegurado_ci' => $cli->persona->cedula
                ]
            );

            Poliza::updateOrCreate(
                ['solicitud_id' => $solicitud->id],
                [
                    'nro_contrato' => $pData['contrato'],
                    'producto_id' => $prod->id,
                    'total' => $totalUsd,
                    'total_bs' => $totalBs,
                    'cobertura_dolares' => $prod->cobertura,
                    'cobertura_bs' => $prod->cobertura * 38.54,
                    'asegurado_nombre' => $cli->persona->nombre,
                    'asegurado_ci' => $cli->persona->cedula,
                    'pago' => $pData['pago'],
                    'tipo' => $pData['tipo'],
                    'fecha_emision' => $pData['emision'],
                    'fecha_vencimiento' => date('Y-m-d', strtotime($pData['emision'] . ' +1 year')),
                    'sede_poliza' => $pData['vendedor']->sede,
                    'vendedor_id' => $pData['vendedor']->id,
                    'status' => $pData['status'],
                    'snapshot_datos' => [
                        'tomador' => [
                            'nombre' => $cli->persona->nombre,
                            'ci' => $cli->persona->cedula,
                        ],
                        'asegurado' => [
                            'nombre' => $cli->persona->nombre,
                            'ci' => $cli->persona->cedula,
                        ],
                        'producto' => [
                            'id' => $prod->id,
                            'nombre' => $prod->nombre,
                            'tipo' => $prod->tipo,
                            'tipo_calculo' => $prod->tipo_calculo,
                            'cobertura' => $prod->cobertura,
                        ],
                        'tarifario' => [
                            'id' => $tarifario->id,
                            'nombre' => $tarifario->nombre,
                            'version' => $tarifario->version,
                            'datos' => $tarifario->datos,
                        ],
                        'coberturas' => [
                            'tasaBCV' => 38.54,
                            'coberturas' => [],
                            'total_usd' => $totalUsd,
                            'total_bs' => $totalBs
                        ],
                        'tasa_bcv' => 38.54,
                        'placa' => $veh->placa,
                        'fecha_emision' => $pData['emision'],
                        'total_usd' => $totalUsd,
                        'total_bs' => $totalBs,
                    ]
                ]
            );
        }

        // 8. Seed standard scheduling rules for external reports
        DB::table('reportes_externos_programaciones')->updateOrInsert(
            ['id' => 1],
            ['nombre' => 'Reporte Externo Diario', 'frecuencia' => 'diario', 'hora' => '08:00', 'activo' => true]
        );
        DB::table('reportes_externos_programaciones')->updateOrInsert(
            ['id' => 2],
            ['nombre' => 'Reporte Externo Semanal', 'frecuencia' => 'semanal', 'hora' => '09:00', 'activo' => true]
        );
        DB::table('reportes_externos_programaciones')->updateOrInsert(
            ['id' => 3],
            ['nombre' => 'Reporte Externo Mensual', 'frecuencia' => 'mensual', 'hora' => '00:00', 'activo' => false]
        );

        // 9. Seed internal reports schedules
        $internalSchedules = [
            ['id' => 1, 'nombre' => 'Reporte diario de ventas',      'frecuencia' => 'diario',    'hora' => '08:00', 'activo' => true],
            ['id' => 2, 'nombre' => 'Reporte semanal de pólizas',    'frecuencia' => 'semanal',   'hora' => '07:00', 'activo' => true],
            ['id' => 3, 'nombre' => 'Reporte mensual SUDEASEG',      'frecuencia' => 'mensual',   'hora' => '00:01', 'activo' => true],
            ['id' => 4, 'nombre' => 'Pólizas próximas a vencer',     'frecuencia' => 'diario',    'hora' => '09:00', 'activo' => true],
            ['id' => 5, 'nombre' => 'Reporte de comisiones',         'frecuencia' => 'quincenal', 'hora' => '08:00', 'activo' => false],
            ['id' => 6, 'nombre' => 'Reporte de cobranza pendiente', 'frecuencia' => 'diario',    'hora' => '08:30', 'activo' => false],
        ];
        foreach ($internalSchedules as $is) {
            DB::table('reportes_internos_programaciones')->updateOrInsert(['id' => $is['id']], $is);
        }

        // 10. Seed internal reports history
        $internalHistory = [
            ['id' => 1, 'nombre_reporte' => 'Ventas diarias',       'fecha_generacion' => '2026-05-07 08:00:00', 'archivo_path' => 'reportes_internos/reporte_ventas_diarias_20260507.xlsx',       'size' => 10240],
            ['id' => 2, 'nombre_reporte' => 'Pólizas por vencer',   'fecha_generacion' => '2026-05-07 09:00:00', 'archivo_path' => 'reportes_internos/reporte_polizas_vencer_20260507.xlsx',       'size' => 8192],
            ['id' => 3, 'nombre_reporte' => 'Ventas diarias',       'fecha_generacion' => '2026-05-06 08:00:00', 'archivo_path' => 'reportes_internos/reporte_ventas_diarias_20260506.xlsx',       'size' => 10210],
            ['id' => 4, 'nombre_reporte' => 'SUDEASEG Mayo',        'fecha_generacion' => '2026-05-01 00:01:00', 'archivo_path' => 'reportes_internos/reporte_sudeaseg_mayo_20260501.xlsx',        'size' => 24576],
            ['id' => 5, 'nombre_reporte' => 'Comisiones quincenal', 'fecha_generacion' => '2026-05-01 00:05:00', 'archivo_path' => 'reportes_internos/reporte_comisiones_quincenal_20260501.xlsx', 'size' => 12288],
        ];
        foreach ($internalHistory as $ih) {
            DB::table('reportes_internos_historial')->updateOrInsert(['id' => $ih['id']], $ih);
            
            // Generar archivo físico si no existe
            $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($ih['archivo_path']);
            $dir = dirname($fullPath);
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
            if (!file_exists($fullPath)) {
                $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
                $sheet = $spreadsheet->getActiveSheet();
                $sheet->setCellValue('A1', 'Reporte Histórico');
                $sheet->setCellValue('B1', $ih['nombre_reporte']);
                $sheet->setCellValue('A3', 'Este es un reporte histórico mock generado por el sistema.');
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
                $writer->save($fullPath);
                $spreadsheet->disconnectWorksheets();
            }
        }
    }
}
