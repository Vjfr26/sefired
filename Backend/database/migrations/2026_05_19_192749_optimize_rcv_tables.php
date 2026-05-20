<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Renombrar catálogo rcv a tarifario_rcv
        Schema::rename('rcv', 'tarifario_rcv');

        // 2. Modificar poliza_rcv para migrar datos de vehiculo_id a poliza_id
        Schema::table('poliza_rcv', function (Blueprint $table) {
            $table->unsignedInteger('poliza_id')->nullable()->after('id');
        });

        // 3. Migrar Datos (Si existen registros, no se pierden)
        $polizasRcv = DB::table('poliza_rcv')->get();
        foreach ($polizasRcv as $prcv) {
            // Buscamos la póliza asociada a través del vehículo y la solicitud
            $poliza = DB::table('poliza')
                ->join('solicitud', 'poliza.solicitud_id', '=', 'solicitud.id')
                ->join('vehiculo', 'solicitud.placa', '=', 'vehiculo.placa')
                ->where('vehiculo.id', $prcv->vehiculo_id)
                ->orderBy('poliza.fecha_emision', 'desc') // Tomar la más reciente
                ->select('poliza.id')
                ->first();

            if ($poliza) {
                DB::table('poliza_rcv')
                    ->where('id', $prcv->id)
                    ->update(['poliza_id' => $poliza->id]);
            } else {
                // Registros huérfanos sin póliza real se eliminan para mantener integridad
                DB::table('poliza_rcv')->where('id', $prcv->id)->delete();
            }
        }

        // 4. Limpieza Estructural en poliza_rcv
        Schema::table('poliza_rcv', function (Blueprint $table) {
            // Eliminar FK y columna vieja
            $table->dropForeign('fk_pol_rcv_vehiculo');
            $table->dropColumn('vehiculo_id');
            
            // Hacer poliza_id NOT NULL
            $table->unsignedInteger('poliza_id')->nullable(false)->change();

            // Preparar ID para ser borrado (quitar auto_increment)
            $table->integer('id')->change();
        });

        // Eliminar PK vieja y hacer poliza_id la nueva PK y FK
        Schema::table('poliza_rcv', function (Blueprint $table) {
            $table->dropPrimary('id');
            $table->dropColumn('id');
            
            $table->primary('poliza_id');
            $table->foreign('poliza_id', 'fk_pol_rcv_poliza')
                  ->references('id')->on('poliza')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('poliza_rcv', function (Blueprint $table) {
            $table->dropForeign('fk_pol_rcv_poliza');
            $table->dropPrimary('poliza_id');
            
            $table->increments('id')->first();
            $table->unsignedInteger('vehiculo_id')->nullable()->after('id');
        });

        // Revertir datos
        $polizasRcv = DB::table('poliza_rcv')->get();
        foreach ($polizasRcv as $prcv) {
            $vehiculo = DB::table('vehiculo')
                ->join('solicitud', 'vehiculo.placa', '=', 'solicitud.placa')
                ->join('poliza', 'solicitud.id', '=', 'poliza.solicitud_id')
                ->where('poliza.id', $prcv->poliza_id)
                ->select('vehiculo.id')
                ->first();

            if ($vehiculo) {
                DB::table('poliza_rcv')->where('id', $prcv->id)->update(['vehiculo_id' => $vehiculo->id]);
            }
        }

        Schema::table('poliza_rcv', function (Blueprint $table) {
            $table->unsignedInteger('vehiculo_id')->nullable(false)->change();
            $table->foreign('vehiculo_id', 'fk_pol_rcv_vehiculo')
                  ->references('id')->on('vehiculo')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
            $table->dropColumn('poliza_id');
        });

        Schema::rename('tarifario_rcv', 'rcv');
    }
};
