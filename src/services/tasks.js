import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../config'
import { showToast } from '../lib/toast'
import { sessionInfo } from './session'
import { demo } from './demo'

export function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    dueDate: row.due_date,
    status: row.status,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    managerId: row.manager_id,
    createdAt: row.created_at,
  }
}

export async function loadMyTasks() {
  if (DEMO_MODE) return demo.myTasks().map(rowToTask)
  if (!supabase || !sessionInfo.userId) return []
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('employee_id', sessionInfo.userId).order('due_date', { ascending: true, nullsFirst: false })
    if (error) throw error
    return (data || []).map(rowToTask)
  } catch (e) {
    console.error(e)
    showToast('Could not load tasks — ' + (e.message || ''))
    return []
  }
}

export async function loadAssignedTasks() {
  if (DEMO_MODE) return demo.assignedTasks().map(rowToTask)
  if (!supabase || !sessionInfo.userId) return []
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('manager_id', sessionInfo.userId).order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(rowToTask)
  } catch (e) {
    console.error(e)
    showToast('Could not load tasks — ' + (e.message || ''))
    return []
  }
}

// employees = [{ id, full_name }] so the employee name can be stored with each task
export async function createTasks(employeeIds, employees, title, description, dueDate) {
  if (DEMO_MODE) { demo.createTasks(employeeIds, employees, title, description, dueDate); return true }
  if (!supabase || !sessionInfo.userId) return false
  const rows = employeeIds.map((empId) => {
    const emp = employees.find((e) => e.id === empId)
    return {
      manager_id: sessionInfo.userId,
      employee_id: empId,
      employee_name: emp ? emp.full_name : '',
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      status: 'todo',
    }
  })
  try {
    const { error } = await supabase.from('tasks').insert(rows)
    if (error) throw error
    return true
  } catch (e) {
    console.error(e)
    showToast('Could not assign task — ' + (e.message || ''))
    return false
  }
}

export async function updateTaskStatus(taskId, status) {
  if (DEMO_MODE) { demo.updateTaskStatus(taskId, status); return }
  if (!supabase) return
  try {
    const { error } = await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId)
    if (error) throw error
  } catch (e) {
    console.error(e)
    showToast('Could not update task — ' + (e.message || ''))
  }
}

export async function deleteTask(taskId) {
  if (DEMO_MODE) { demo.deleteTask(taskId); return }
  if (!supabase) return
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) throw error
  } catch (e) {
    console.error(e)
    showToast('Could not delete task — ' + (e.message || ''))
  }
}
