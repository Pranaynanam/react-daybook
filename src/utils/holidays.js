import { WORK_DAYS } from '../config'
import { daysInMonth, isoOf, todayISO } from './dates'

// ---- Using the holiday map: { 'YYYY-MM-DD': 'Holiday name' } ----
export function isWorkDay(iso, holidays) {
  return WORK_DAYS.includes(new Date(iso + 'T00:00:00').getDay()) && !holidays[iso]
}
export function monthHolidayCount(holidays, yearMonth) {
  return Object.keys(holidays).filter((d) => d.startsWith(yearMonth)).length
}
// working days before today with no report from this person
export function pendingDays(yearMonth, employeeName, monthData, holidays) {
  const today = todayISO()
  const out = []
  for (let day = 1; day <= daysInMonth(yearMonth); day++) {
    const iso = isoOf(yearMonth, day)
    if (iso >= today) break
    if (isWorkDay(iso, holidays) && !(monthData[iso] || {})[employeeName]) out.push(iso)
  }
  return out
}
export function whenLabel(iso) {
  const today = todayISO()
  if (iso === today) return 'Today'
  if (iso < today) return ''
  const days = Math.round((new Date(iso + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000)
  return days === 1 ? 'Tomorrow' : 'In ' + days + ' days'
}

// ---- Reading HR's holiday sheet (Excel .xlsx or CSV) ----
const MONTHS3 = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
export function mkISO(y,m,d){
  if(y<100) y += 2000;
  const dt = new Date(y, m, d);
  if(dt.getFullYear()!==y || dt.getMonth()!==m || dt.getDate()!==d) return null;
  return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
export function parseHolDate(v){
  if(v==null || v==='') return null;
  if(typeof v==='number'){
    if(v<30000 || v>80000) return null; // not an Excel date serial (e.g. a serial number column)
    const dt = new Date(Date.UTC(1899,11,30) + Math.round(v)*86400000);
    return mkISO(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  }
  const t = String(v).trim().replace(/(\d)(st|nd|rd|th)\b/i,'$1').replace(/,/g,' ').replace(/\s+/g,' ');
  let m;
  if((m = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return mkISO(+m[1], m[2]-1, +m[3]);
  if((m = t.match(/^(\d{1,2})[-\/. ](\d{1,2})[-\/. ](\d{2,4})(?:\s.*)?$/))){
    let d=+m[1], mo=+m[2]-1;
    if(mo>11 && d<=12){ const x=d-1; d=mo+1; mo=x; } // looks like mm/dd — swap
    return mkISO(+m[3], mo, d);
  }
  if((m = t.match(/^(\d{1,2})[-\/. ]([A-Za-z]{3,9})[-\/. ](\d{2,4})/))){
    const mo = MONTHS3[m[2].slice(0,3).toLowerCase()];
    return mo===undefined ? null : mkISO(+m[3], mo, +m[1]);
  }
  if((m = t.match(/^([A-Za-z]{3,9})[-\/. ](\d{1,2})[-\/. ](\d{2,4})/))){
    const mo = MONTHS3[m[1].slice(0,3).toLowerCase()];
    return mo===undefined ? null : mkISO(+m[3], mo, +m[2]);
  }
  return null;
}
// rows = array of arrays (from Excel or CSV). Picks the date + name out of each row.
export function extractHolidays(rows){
  const found = {}; let skipped = 0;
  const weekday = /^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/i;
  rows.forEach(r=>{
    const cells = (r||[]).map(c=>c==null?'':c);
    let di = -1, date = null;
    for(let i=0;i<cells.length;i++){ const d = parseHolDate(cells[i]); if(d){ di=i; date=d; break; } }
    if(di<0){ if(cells.some(c=>String(c).trim())) skipped++; return; }
    let name = '';
    for(let i=0;i<cells.length;i++){
      if(i===di) continue;
      const t = String(cells[i]).trim();
      if(!t || weekday.test(t) || /^\d+$/.test(t) || parseHolDate(cells[i])) continue;
      name = t; break;
    }
    found[date] = name || 'Holiday';
  });
  const list = Object.keys(found).sort().map(date=>({ date, name: found[date] }));
  return { rows: list, skipped };
}
export function parseCSVText(text){
  text = text.replace(/^﻿/,'');
  const rows = []; let row = [], cell = '', q = false;
  for(let i=0;i<text.length;i++){
    const c = text[i];
    if(q){
      if(c==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=c;
    } else if(c==='"') q = true;
    else if(c===',' || c===';' || c==='\t'){ row.push(cell); cell=''; }
    else if(c==='\n' || c==='\r'){ if(c==='\r' && text[i+1]==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; }
    else cell+=c;
  }
  if(cell!=='' || row.length){ row.push(cell); rows.push(row); }
  return rows;
}

function dateCellToISO(d) {
  // Excel date cells arrive as Date objects; use UTC parts when they sit at UTC midnight
  const utcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
  return utcMidnight
    ? mkISO(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    : mkISO(d.getFullYear(), d.getMonth(), d.getDate())
}

// Returns rows (arrays of cells) from an uploaded .xlsx or .csv file
export async function readHolidayFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext === 'csv' || ext === 'txt') return parseCSVText(await file.text())
  const { readSheet } = await import('read-excel-file/browser')
  const rows = await readSheet(file)
  return rows.map((r) => r.map((c) => (c instanceof Date ? dateCellToISO(c) : c)))
}
