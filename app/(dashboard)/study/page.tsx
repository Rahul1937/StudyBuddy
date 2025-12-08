'use client'

import { useState, useEffect } from 'react'
import { useTimer } from '@/contexts/TimerContext'
import { formatTime } from '@/lib/utils'

interface StudyCategory {
  id: string
  name: string
  icon: string | null
  color: string | null
}

export default function StudyPage() {
  const { isRunning, isPaused, elapsedTime, category, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer } = useTimer()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<StudyCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // Fetch user categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Sync selectedCategory with timer category when restored
  useEffect(() => {
    if (category && !selectedCategory) {
      setSelectedCategory(category)
    }
  }, [category, selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
      
      // If no categories exist, create default ones
      if (data.categories.length === 0) {
        await createDefaultCategories()
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultCategories = async () => {
    const defaults = [
      { name: 'Revision', icon: '📚' },
      { name: 'Self Study', icon: '📖' },
      { name: 'Class', icon: '🎓' },
    ]
    
    for (const cat of defaults) {
      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        })
      } catch (error) {
        console.error('Error creating default category:', error)
      }
    }
    
    // Refresh categories
    fetchCategories()
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    setIsAddingCategory(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
        }),
      })

      if (response.ok) {
        setNewCategoryName('')
        setNewCategoryIcon('📝')
        setShowAddCategory(false)
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Failed to create category')
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
        // If deleted category was selected, clear selection
        if (selectedCategory === categories.find(c => c.id === categoryId)?.name) {
          setSelectedCategory(null)
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const handleStart = () => {
    if (!selectedCategory) {
      alert('Please select a category')
      return
    }
    startTimer(selectedCategory)
  }

  const handleRecordSession = async () => {
    try {
      await stopTimer()
      alert('Study session saved! 🎉')
    } catch (error) {
      alert('Failed to save session')
    }
  }

  const commonIcons = ['📚', '📖', '🎓', '✏️', '📝', '💻', '🔬', '📊', '📋', '🎯', '⚡', '🌟']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
        <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Focus Session</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Track your study sessions</p>
            <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-slate-100">Timer</h2>
            <div className="text-center mb-4 p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1.5">
                {formatTime(elapsedTime)}
              </div>
              {category && (
                <p className="text-slate-700 dark:text-slate-300 capitalize font-semibold text-sm">
                  {category}
                </p>
              )}
              {isPaused && (
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-1.5 font-semibold">
                  ⏸ Paused
                </p>
              )}
            </div>

            {!isRunning ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Category
                    </label>
                    <button
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Add Category</span>
                    </button>
                  </div>

                  {/* Add Category Form */}
                  {showAddCategory && (
                    <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                            Category Name
                          </label>
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g., Math Practice"
                            className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                            Icon
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newCategoryIcon}
                              onChange={(e) => setNewCategoryIcon(e.target.value)}
                              maxLength={2}
                              className="w-14 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center text-base"
                            />
                            <div className="flex gap-0.5 flex-wrap">
                              {commonIcons.map((icon) => (
                                <button
                                  key={icon}
                                  onClick={() => setNewCategoryIcon(icon)}
                                  className={`w-7 h-7 rounded-lg border-2 text-base transition-all ${
                                    newCategoryIcon === icon
                                      ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/50'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                  }`}
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim() || isAddingCategory}
                            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-1.5 px-3 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs"
                          >
                            {isAddingCategory ? 'Adding...' : 'Add Category'}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddCategory(false)
                              setNewCategoryName('')
                              setNewCategoryIcon('📝')
                            }}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-semibold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Categories Grid */}
                  {categories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="relative group"
                        >
                          <button
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                              selectedCategory === cat.name
                                ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-md scale-105 ring-2 ring-blue-200 dark:ring-blue-900'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:shadow-md'
                            }`}
                          >
                            <div className="text-xl mb-0.5">{cat.icon || '📝'}</div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{cat.name}</div>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-opacity text-[10px]"
                            title="Delete category"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      <p className="text-xs mb-1">No categories yet. Click &quot;Add Category&quot; to create one!</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleStart}
                  disabled={!selectedCategory}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold text-sm disabled:shadow-none"
                >
                  Start Timer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {!isPaused ? (
                  <button
                    onClick={pauseTimer}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md font-bold text-sm"
                  >
                    ⏸ Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md font-bold text-sm"
                  >
                    ▶ Resume
                  </button>
                )}
                <button
                  onClick={handleRecordSession}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md font-bold text-sm"
                >
                  📝 Record Session
                </button>
                <button
                  onClick={resetTimer}
                  className="w-full bg-slate-600 dark:bg-slate-700 text-white py-2.5 px-4 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 font-semibold text-sm"
                >
                  Reset
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
