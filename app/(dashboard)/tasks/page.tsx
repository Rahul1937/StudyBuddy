'use client'

import { useEffect, useState } from 'react'

interface Task {
  id: string
  title: string
  status: string
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle }),
      })

      if (response.ok) {
        setNewTaskTitle('')
        fetchTasks()
      }
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400 font-medium">Loading tasks...</div>
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tasks</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Manage your study tasks and track progress</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 font-medium"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || isAdding}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg disabled:shadow-none"
          >
            Add Task
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
              Pending ({pendingTasks.length})
            </h2>
            {pendingTasks.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 font-medium">No pending tasks</p>
            ) : (
              <ul className="space-y-2">
                {pendingTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleToggleStatus(task.id, task.status)}
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-slate-900 dark:text-slate-100 font-medium">{task.title}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">
              Completed ({completedTasks.length})
            </h2>
            {completedTasks.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 font-medium">No completed tasks</p>
            ) : (
              <ul className="space-y-2">
                {completedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggleStatus(task.id, task.status)}
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-slate-600 dark:text-slate-400 line-through font-medium">{task.title}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

