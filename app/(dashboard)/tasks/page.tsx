'use client'

import { useEffect, useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { format, isToday, isYesterday, isThisWeek, parseISO, startOfDay } from 'date-fns'

interface Task {
  id: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

type ColumnId = 'todo' | 'in-progress' | 'done'

const columns: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'done', title: 'Done', color: 'bg-emerald-50 dark:bg-emerald-950/30' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
        body: JSON.stringify({ title: newTaskTitle, status: 'todo' }),
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as ColumnId

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === draggableId ? { ...task, status: newStatus } : task))
    )

    // Update in database
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (error) {
      console.error('Error updating task:', error)
      // Revert on error
      fetchTasks()
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

  // Format date for display
  const formatTaskDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isThisWeek(date)) return format(date, 'EEEE') // Day name
    return format(date, 'MMM d, yyyy')
  }

  // Group tasks by date
  const groupTasksByDate = (taskList: Task[]) => {
    const grouped: Record<string, Task[]> = {}
    taskList.forEach((task) => {
      const dateKey = format(startOfDay(parseISO(task.createdAt)), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(task)
    })
    return grouped
  }

  // Get active tasks (non-completed) and completed tasks separately
  const activeTasks = useMemo(() => {
    return tasks.filter((task) => task.status !== 'done')
  }, [tasks])

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.status === 'done')
  }, [tasks])

  // Get tasks to display based on filters
  const tasksToDisplay = useMemo(() => {
    let filtered = activeTasks
    if (showCompleted) {
      filtered = [...activeTasks, ...completedTasks]
    }
    if (selectedDate) {
      filtered = filtered.filter((task) => {
        const taskDate = format(startOfDay(parseISO(task.createdAt)), 'yyyy-MM-dd')
        return taskDate === selectedDate
      })
    }
    return filtered
  }, [activeTasks, completedTasks, showCompleted, selectedDate])

  // Get unique dates for filter
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    tasks.forEach((task) => {
      dates.add(format(startOfDay(parseISO(task.createdAt)), 'yyyy-MM-dd'))
    })
    return Array.from(dates).sort().reverse()
  }, [tasks])

  const getTasksByStatus = (status: ColumnId, taskList: Task[] = tasksToDisplay) => {
    return taskList.filter((task) => task.status === status)
  }

  // Get date groups for the current view
  const dateGroups = useMemo(() => {
    const grouped = groupTasksByDate(tasksToDisplay)
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a)) // Sort newest first
      .map(([date, tasks]) => ({
        date,
        tasks,
        displayDate: formatTaskDate(date),
      }))
  }, [tasksToDisplay])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Tasks</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Manage your tasks with a Kanban board</p>
        </div>
        
        {/* Filters */}
        {loading ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-200 dark:bg-slate-700 rounded-lg h-8 w-32 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-20 animate-pulse" />
              <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-5 w-9 animate-pulse" />
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-8 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter */}
          {availableDates.length > 0 && (
            <select
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value || null)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Dates</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatTaskDate(date)}
                </option>
              ))}
            </select>
          )}

          {/* Show Completed Toggle - Better looking toggle switch */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Show Completed
            </span>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                showCompleted
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  showCompleted ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              ({completedTasks.length})
            </span>
          </div>
          </div>
        )}
      </div>

      {/* Add Task Input and Task Statistics - Enhanced Layout */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg h-9 animate-pulse" />
              <div className="bg-slate-200 dark:bg-slate-700 rounded-lg h-9 w-24 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-16 animate-pulse" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-lg h-6 w-24 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:col-span-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700 text-center">
                <div className="bg-slate-200 dark:bg-slate-700 rounded h-2.5 w-12 mx-auto mb-0.5 animate-pulse" />
                <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-8 mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Add Task Input - Enhanced with Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            {/* Main Input Section */}
            <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new task..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm font-medium"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || isAdding}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md disabled:shadow-none"
          >
                {isAdding ? 'Adding...' : 'Add Task'}
          </button>
        </div>

            {/* Quick Task Templates */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Quick add:</span>
              {['Study for exam', 'Complete assignment', 'Review notes', 'Practice problems'].map((template) => (
                <button
                  key={template}
                  onClick={() => {
                    setNewTaskTitle(template)
                  }}
                  className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task Statistics - Compact */}
        <div className="grid grid-cols-2 gap-2 lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Total</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{tasks.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">To Do</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {getTasksByStatus('todo', tasks).length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">In Progress</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {getTasksByStatus('in-progress', tasks).length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Done</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {completedTasks.length}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-3 min-w-max md:grid md:grid-cols-3 md:min-w-0">
            {[1, 2, 3].map((col) => (
              <div key={col} className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col w-80 md:w-auto" style={{ minHeight: '450px' }}>
                <div className="px-3 py-2 rounded-t-lg border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-20 animate-pulse" />
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-5 w-6 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-full mb-1.5 animate-pulse" />
                      <div className="bg-slate-200 dark:bg-slate-700 rounded h-2 w-24 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-3 min-w-max md:grid md:grid-cols-3 md:min-w-0">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)

            return (
              <div
                key={column.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col w-80 md:w-auto"
                style={{ minHeight: '450px' }}
              >
                {/* Column Header */}
                <div className={`${column.color} px-3 py-2 rounded-t-lg border-b border-slate-200 dark:border-slate-700`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {column.title}
            </h2>
                    <span className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 transition-colors overflow-y-auto ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50 dark:bg-blue-950/20'
                          : 'bg-transparent'
                      }`}
                    >
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
                          No tasks
                        </div>
                      ) : (
                        // Group tasks by date within each column
                        (() => {
                          const groupedByDate = groupTasksByDate(columnTasks)
                          const sortedDates = Object.keys(groupedByDate).sort().reverse()
                          let globalIndex = 0

                          return sortedDates.map((date) => (
                            <div key={date} className="mb-3">
                              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 px-1.5">
                                {formatTaskDate(date)}
                              </div>
                              {groupedByDate[date].map((task) => {
                                const index = globalIndex++
                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`mb-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                          snapshot.isDragging
                                            ? 'shadow-xl ring-2 ring-blue-500 dark:ring-blue-400'
                                            : ''
                                        } ${task.status === 'done' ? 'opacity-75' : ''}`}
                                        style={provided.draggableProps.style}
                                      >
                                        <div className="flex items-start justify-between gap-1.5">
                                          <p
                                            className={`text-sm font-medium flex-1 break-words ${
                                              task.status === 'done'
                                                ? 'text-slate-500 dark:text-slate-400 line-through'
                                                : 'text-slate-900 dark:text-slate-100'
                                            }`}
                                          >
                                            {task.title}
                                          </p>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteTask(task.id)
                                            }}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex-shrink-0 ml-1"
                                            title="Delete task"
                                          >
                                            <svg
                                              className="w-3.5 h-3.5"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between">
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                            Created: {formatTaskDate(task.createdAt)}
                                          </span>
                                          {task.status === 'done' && task.updatedAt !== task.createdAt && (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                              ✓ Completed
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                )
                              })}
                            </div>
                          ))
                        })()
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
          </div>
        </div>
      </DragDropContext>
      )}

      {/* Completed Tasks History (Collapsible) */}
      {completedTasks.length > 0 && !showCompleted && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 border border-slate-200 dark:border-slate-700">
                    <button
            onClick={() => setShowCompleted(true)}
            className="w-full text-left flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <span className="text-sm font-medium">
              View completed tasks ({completedTasks.length})
            </span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
                    </button>
        </div>
      )}
    </div>
  )
}
