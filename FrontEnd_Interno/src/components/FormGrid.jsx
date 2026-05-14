export default function FormGrid({ fields }) {
  return (
    <>
      {fields.map((f, i) => (
        <div key={i} className={f.span ? 'sm:col-span-2' : ''}>
          <label className="field-label">{f.label}</label>
          {f.type === 'select' ? (
            <select className="select-field" defaultValue={f.val || ''}>
              {(f.opts || []).map(o => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea rows={3} placeholder={f.ph || ''} className="input-field resize-none" defaultValue={f.val || ''} />
          ) : (
            <input
              type={f.type || 'text'}
              defaultValue={f.val || ''}
              placeholder={f.ph || ''}
              className="input-field"
              readOnly={f.ro}
            />
          )}
        </div>
      ))}
    </>
  )
}
