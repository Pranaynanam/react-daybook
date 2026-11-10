import { Fragment, useState } from 'react'
import { useApp } from '../context/AppContext'
import { deleteHoliday, saveHolidays } from '../services/holidays'
import { showToast } from '../lib/toast'
import { downloadCSV } from '../utils/csv'
import { fmtDate, todayISO } from '../utils/dates'
import { extractHolidays, readHolidayFile, whenLabel } from '../utils/holidays'

const EMPTY_PREVIEW = { rows: [], skipped: 0, file: '', error: '' }

export default function Holidays() {
  const { holidays, refreshHolidays, inManagerMode: canManage } = useApp()
  const [preview, setPreview] = useState(EMPTY_PREVIEW)
  const [saving, setSaving] = useState(false)
  const [addDate, setAddDate] = useState('')
  const [addName, setAddName] = useState('')
  const dates = Object.keys(holidays).sort()
  const today = todayISO()

  async function onFile(e) {
    const f = e.target.files[0]
    if (!f) return
    try {
      const r = extractHolidays(await readHolidayFile(f))
      setPreview({ rows: r.rows, skipped: r.skipped, file: f.name,
        error: r.rows.length ? '' : 'No dates found in this file. Make sure it has a column with dates (like 26-Jan-2026) and one with the holiday name.' })
    } catch (err) {
      console.error(err)
      setPreview({ rows: [], skipped: 0, file: f.name, error: 'Could not read this file. Save it as .xlsx or .csv and upload again.' })
    }
    e.target.value = ''
  }

  async function importAll() {
    const rows = preview.rows
    setSaving(true)
    if (await saveHolidays(rows)) {
      await refreshHolidays()
      setPreview(EMPTY_PREVIEW)
      showToast(rows.length + ' holiday' + (rows.length === 1 ? '' : 's') + ' saved')
    }
    setSaving(false)
  }

  async function addOne() {
    if (!addDate) { showToast('Pick a date first'); return }
    if (!addName.trim()) { showToast('Add a holiday name'); return }
    if (await saveHolidays([{ date: addDate, name: addName.trim() }])) {
      await refreshHolidays(); showToast('Holiday added'); setAddDate(''); setAddName('')
    }
  }

  async function remove(iso) {
    await deleteHoliday(iso); await refreshHolidays(); showToast('Holiday removed')
  }

  function downloadSample() {
    const y = new Date().getFullYear()
    downloadCSV('holidays_sample.csv', [['Date', 'Day', 'Holiday'], [y + '-01-01', '', 'New Year’s Day'], ['26-01-' + y, '', 'Republic Day'], ['15-Aug-' + y, '', 'Independence Day'], ['02/10/' + y, '', 'Gandhi Jayanti'], [y + '-12-25', '', 'Christmas']])
  }

  let year = ''
  return (
    <>
      {canManage ? (
        <div className="card section hol-card">
          <h2>Add holidays from HR’s sheet</h2>
          <p className="hol-help">Upload the Excel (.xlsx) or CSV file HR sends. Daybook finds the dates and holiday names by itself — you can check the list before saving. Uploading again just updates matching dates.</p>
          <div className="hol-pick">
            <input type="file" id="hol-file" accept=".xlsx,.csv,.txt" aria-label="Choose HR holiday sheet" onChange={onFile} />
            <button className="btn-text" id="hol-sample" type="button" onClick={downloadSample}>Download sample file</button>
          </div>
          {preview.error ? <div className="hol-err">{preview.error}</div> : null}
          {preview.rows.length ? (
            <div className="hol-preview">
              <div className="ph">
                <span>
                  <strong>{preview.rows.length} holiday{preview.rows.length === 1 ? '' : 's'}</strong> found in {preview.file}
                  {preview.skipped ? <span style={{ color: 'var(--ink-soft)' }}> · {preview.skipped} other row{preview.skipped === 1 ? '' : 's'} ignored</span> : null}
                </span>
                <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost" id="hol-cancel" type="button" onClick={() => setPreview(EMPTY_PREVIEW)}>Cancel</button>
                  <button className="btn btn-primary" id="hol-import" type="button" disabled={saving} onClick={importAll}>Save {preview.rows.length} holiday{preview.rows.length === 1 ? '' : 's'}</button>
                </span>
              </div>
              <div className="hol-rows">
                {preview.rows.map((r) => (
                  <div className="hol-row" key={r.date}><span className="hd">{fmtDate(r.date)}, {r.date.slice(0, 4)}</span><span className="hn">{r.name}</span><span /></div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="hol-add">
            <input type="date" id="hol-add-date" className="control" aria-label="Holiday date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
            <input type="text" id="hol-add-name" className="control" placeholder="Or add one: holiday name" autoComplete="off" aria-label="Holiday name" value={addName} onChange={(e) => setAddName(e.target.value)} />
            <button className="btn btn-ghost" id="hol-add" type="button" onClick={addOne}>Add</button>
          </div>
        </div>
      ) : null}

      <div className="card section">
        <h2>Company holidays</h2>
        <div className="hol-help" style={{ marginBottom: 6 }}>{dates.length} on the calendar. These days are skipped when counting working days you still need to report.</div>
        {!dates.length ? (
          <div className="task-empty">
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>No holidays added yet</div>
            <div>{canManage ? 'Upload HR’s sheet above and they’ll appear on everyone’s calendar.' : 'Once HR’s holiday list is added, it will show here and on your timesheet.'}</div>
          </div>
        ) : dates.map((d) => {
          const y = d.slice(0, 4)
          const head = y !== year ? <div className="hol-year" key={'y' + y}>{y}</div> : null
          year = y
          const when = whenLabel(d)
          return (
            <Fragment key={d}>
              {head}
              <div className={'hol-row' + (d < today ? ' past' : '')}>
                <span className="hd">{fmtDate(d)}</span>
                <span className="hn">{holidays[d]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {when ? <span className="when">{when}</span> : null}
                  {canManage ? <button className="btn-danger-text hol-del" title="Remove holiday" aria-label={'Remove ' + holidays[d]} onClick={() => remove(d)}>✕</button> : null}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </>
  )
}
