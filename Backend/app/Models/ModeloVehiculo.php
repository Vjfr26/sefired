<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModeloVehiculo extends Model
{
    protected $table = 'modelo_vehiculo';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'marca',
        'modelo',
    ];
}
