import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pencil, Trash2, Car, Truck, Bike, Plus, AlertTriangle, X, Check } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import DataTable from '../components/DataTable.jsx'
import SearchBar from '../components/SearchBar.jsx'
import { fetchVehiculosCatalogo, createVehiculoCatalogo, updateVehiculoCatalogo, deleteVehiculoCatalogo } from '../api/vehiculosCatalogo.js'

// Tipos sugeridos por defecto. El campo es libre: se pueden agregar tipos
// nuevos (el backend ya no los restringe a esta lista).
const TIPOS_VEHICULO_BASE = ['Automóvil', 'Camioneta', 'Motocicleta', 'Camión / Carga']

// Icono representativo según el tipo (cae a Car para tipos desconocidos).
const tipoIcon = (t) => {
  const s = (t || '').toLowerCase()
  if (s.includes('moto')) return Bike
  if (s.includes('camión') || s.includes('camion') || s.includes('carga') || s.includes('camioneta')) return Truck
  return Car
}

// Formulario Modal para Agregar / Editar
function CatalogoModal({ item, tipos = TIPOS_VEHICULO_BASE, marcas = [], modelosPorMarca = {}, onClose, onSaved }) {
  const { showToast } = useApp()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: item?.tipo ?? 'Automóvil',
    marca: item?.marca ?? '',
    modelo: item?.modelo ?? '',
    anio_inicio: item?.anio_inicio ?? 2000,
    anio_fin: item?.anio_fin ?? new Date().getFullYear(),
  })
  // "Otro": modo texto libre cuando el tipo no es uno de los conocidos.
  const [customTipo, setCustomTipo] = useState(item?.tipo ? !tipos.includes(item.tipo) : false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.tipo.trim()) {
      showToast('Selecciona o escribe el tipo de vehículo', 'error')
      return
    }
    if (!form.marca.trim() || !form.modelo.trim()) {
      showToast('Por favor complete todos los campos', 'error')
      return
    }

    if (parseInt(form.anio_inicio) > parseInt(form.anio_fin)) {
      showToast('El año de inicio no puede ser mayor que el año de fin', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        tipo: form.tipo,
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio_inicio: parseInt(form.anio_inicio),
        anio_fin: parseInt(form.anio_fin),
      }

      if (item?.id) {
        await updateVehiculoCatalogo(item.id, payload)
        showToast('Modelo de vehículo actualizado en el catálogo', 'success')
      } else {
        await createVehiculoCatalogo(payload)
        showToast('Modelo de vehículo agregado al catálogo', 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'input-field text-sm'
  const lbl = 'field-label'

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-jm-blue/10 text-jm-blue flex items-center justify-center shrink-0">
              <Car className="w-[18px] h-[18px]" />
            </span>
            <h3 className="text-base font-black text-slate-800 truncate">
              {item?.id ? 'Editar Modelo' : 'Añadir Modelo al Catálogo'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4">
            <div>
              <label className={lbl}>Tipo de Vehículo <span className="text-rose-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {tipos.map(t => {
                  const Icon = tipoIcon(t)
                  const active = !customTipo && form.tipo === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setCustomTipo(false); set('tipo', t) }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                        active
                          ? 'bg-jm-blue text-white border-jm-blue shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-jm-blue/40 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {t}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => { setCustomTipo(true); set('tipo', '') }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                    customTipo
                      ? 'bg-jm-blue text-white border-jm-blue shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-jm-blue/40 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Otro
                </button>
              </div>
              {customTipo && (
                <input
                  type="text"
                  className={`${inp} mt-2`}
                  placeholder="Escribe el tipo (ej. Buseta, Remolque…)"
                  value={form.tipo}
                  maxLength={30}
                  onChange={e => set('tipo', e.target.value)}
                  autoFocus
                  required
                />
              )}
            </div>

            <div>
              <label className={lbl}>Marca <span className="text-rose-500">*</span></label>
              <input
                type="text"
                className={inp}
                placeholder="Ej. Toyota"
                list="cat-marcas"
                value={form.marca}
                maxLength={40}
                onChange={e => set('marca', e.target.value)}
                required
              />
              <datalist id="cat-marcas">
                {marcas.map(m => <option key={m} value={m} />)}
              </datalist>
              <p className="text-[10px] text-slate-400 mt-1">Elige de la lista si ya existe, para no duplicar (ej. "Toyota").</p>
            </div>

            <div>
              <label className={lbl}>Modelo <span className="text-rose-500">*</span></label>
              <input
                type="text"
                className={inp}
                placeholder="Ej. Corolla"
                list="cat-modelos"
                value={form.modelo}
                maxLength={40}
                onChange={e => set('modelo', e.target.value)}
                required
              />
              <datalist id="cat-modelos">
                {(modelosPorMarca[form.marca] || []).map(m => <option key={m} value={m} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Año Desde <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  className={inp}
                  min="1900"
                  max="2100"
                  value={form.anio_inicio}
                  onChange={e => set('anio_inicio', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={lbl}>Año Hasta <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  className={inp}
                  min="1900"
                  max="2100"
                  value={form.anio_fin}
                  onChange={e => set('anio_fin', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              <Check className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VehiculosCatalogo() {
  const { showModal, showToast, canAct } = useApp()
  
  // Validamos los permisos usando el módulo 'cat-vehiculos'
  const canView = canAct('cat-vehiculos', 'view')
  const canEdit = canAct('cat-vehiculos', 'edit')
  const canDelete = canAct('cat-vehiculos', 'delete')
  const canCreate = canAct('cat-vehiculos', 'create')

  const [catalogo, setCatalogo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchVehiculosCatalogo()
      setCatalogo(data)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (canView) {
      load()
    }
  }, [canView, load])

  // Tipos disponibles para filtrar/sugerir: los base + los que ya existan en
  // el catálogo (así los tipos nuevos aparecen sin tocar código).
  const tiposUnicos = useMemo(() => {
    const set = new Set(TIPOS_VEHICULO_BASE)
    for (const it of catalogo) if (it.tipo) set.add(it.tipo)
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [catalogo])

  // Marcas existentes (para autocompletar y evitar duplicados mal escritos) y
  // los modelos por marca (para sugerir el modelo según la marca elegida).
  const marcasUnicas = useMemo(
    () => [...new Set(catalogo.map(i => i.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [catalogo]
  )
  const modelosPorMarca = useMemo(() => {
    const map = {}
    for (const it of catalogo) {
      if (!it.marca || !it.modelo) continue
      ;(map[it.marca] ??= new Set()).add(it.modelo)
    }
    return Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, [...v].sort((a, b) => a.localeCompare(b, 'es'))])
    )
  }, [catalogo])

  const filtered = useMemo(() => {
    return catalogo.filter(item => {
      if (selectedTipo && item.tipo !== selectedTipo) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.marca?.toLowerCase().includes(q) ||
        item.modelo?.toLowerCase().includes(q) ||
        item.tipo?.toLowerCase().includes(q)
      )
    })
  }, [catalogo, search, selectedTipo])

  const rows = useMemo(() => {
    return filtered.map(item => ({
      ...item,
      rango_anios: `${item.anio_inicio} - ${item.anio_fin}`,
      acc: (
        <div className="flex gap-1.5 justify-center">
          {canEdit && (
            <button
              onClick={() => setEditItem(item)}
              className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              title="Editar"
            >
              <Pencil className="w-[18px] h-[18px]" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => showModal('confirmDelete', {
                name: `${item.marca} ${item.modelo}`,
                onConfirm: async () => {
                  await deleteVehiculoCatalogo(item.id)
                  showToast('Modelo eliminado del catálogo', 'success')
                  load()
                },
              })}
              className="p-2.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
              title="Eliminar"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      )
    }))
  }, [filtered, canEdit, canDelete, showModal, load, showToast])

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Car className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder al catálogo de vehículos.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      {/* Hero Header */}
      <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463 0%,#000c3b 55%,#001a6e 100%)' }}>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-9">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-3">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Configuración · Catálogo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-1.5">
              Catálogo de <span className="text-emerald-400">Vehículos</span>
            </h2>
            <p className="text-sm text-white/50">Base de datos de marcas, modelos y rango de años utilizables en las cotizaciones.</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary shrink-0 self-start sm:self-center">
              <Plus className="w-4 h-4" /> Añadir Modelo
            </button>
          )}
        </div>
      </div>

      {/* Buscador y Filtros */}
      <SearchBar
        placeholder="Buscar por marca, modelo o tipo..."
        onSearch={setSearch}
        extra={
          <>
            <select
              className="select-field text-sm w-auto"
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} modelo{filtered.length !== 1 ? 's' : ''}</p>
          </>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tabla de datos */}
      <DataTable
        cols={[
          { k: 'tipo', l: 'Tipo', nw: true },
          { k: 'marca', l: 'Marca', bold: true, nw: true },
          { k: 'modelo', l: 'Modelo', nw: true },
          { k: 'rango_anios', l: 'Años Permitidos', nw: true },
          { k: 'acc', l: '', acc: true }
        ]}
        rows={rows}
        loading={loading}
        emptyMsg="No hay vehículos registrados en el catálogo."
      />

      {/* Modal para añadir */}
      {showAddModal && (
        <CatalogoModal
          tipos={tiposUnicos}
          marcas={marcasUnicas}
          modelosPorMarca={modelosPorMarca}
          onClose={() => setShowAddModal(false)}
          onSaved={load}
        />
      )}

      {/* Modal para editar */}
      {editItem && (
        <CatalogoModal
          item={editItem}
          tipos={tiposUnicos}
          marcas={marcasUnicas}
          modelosPorMarca={modelosPorMarca}
          onClose={() => setEditItem(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
