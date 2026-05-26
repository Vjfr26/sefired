<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Beneficiaries for life/death/accident policies (APOV, ALPD, etc.).
 * The sum of `porcentaje` across a policy's beneficiaries should equal 100.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('poliza_id');
            $table->foreign('poliza_id')
                  ->references('id')->on('poliza')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            $table->string('nombre',     120);
            $table->string('cedula',     20)->nullable();
            $table->string('parentesco', 50)->nullable();

            // Percentage of the sum insured assigned to this beneficiary (0–100)
            $table->decimal('porcentaje', 5, 2)->default(100);

            $table->timestamps();

            $table->index('poliza_id', 'idx_beneficiarios_poliza');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiarios');
    }
};
