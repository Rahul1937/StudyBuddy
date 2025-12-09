'use client'

import { useState, useEffect } from 'react'
import { useTimer } from '@/contexts/TimerContext'
import { useModal } from '@/contexts/ModalContext'
import { formatTime } from '@/lib/utils'

const motivationalQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Study hard, for the well is deep and our brains are shallow.", author: "Richard Baxter" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Invest in yourself. Your career is the engine of your wealth.", author: "Paul Clitheroe" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The only person who is educated is the one who has learned how to learn and change.", author: "Carl Rogers" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
]

interface StudyCategory {
  id: string
  name: string
  icon: string | null
  color: string | null
}

export default function StudyPage() {
  const { isRunning, isPaused, elapsedTime, category, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer } = useTimer()
  const { showAlert, showConfirm, showSuccess, showError, showWarning } = useModal()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<StudyCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string } | null>(null)

  // Fetch user categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Set a random motivational quote on page load/visit
  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    setCurrentQuote(randomQuote)
  }, []) // Empty dependency array means it runs once on mount

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
      await showWarning('Please enter a category name', 'Category Name Required')
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
        await showError(data.error || 'Failed to create category', 'Error')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      await showError('Failed to create category', 'Error')
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      type: 'confirm',
    })
    
    if (!confirmed) return

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
      await showError('Failed to delete category', 'Error')
    }
  }

  const handleStart = () => {
    if (!selectedCategory) {
      showWarning('Please select a category', 'Category Required')
      return
    }
    startTimer(selectedCategory)
  }

  const handleRecordSession = async () => {
    try {
      await stopTimer()
      await showSuccess('Study session saved! 🎉', 'Success')
    } catch (error) {
      await showError('Failed to save session', 'Error')
    }
  }

  const commonIcons = ['📚', '📖', '🎓', '✏️', '📝', '💻', '🔬', '📊', '📋', '🎯', '⚡', '🌟']

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Focus Session
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Stay focused and track your study time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Timer Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timer Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="inline-block p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl border-2 border-blue-200 dark:border-blue-900/50 shadow-inner">
                <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {formatTime(elapsedTime)}
                </div>
                {category && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-lg">{categories.find(c => c.name === category)?.icon || '📚'}</span>
                    <p className="text-slate-700 dark:text-slate-300 capitalize font-semibold text-sm">
                      {category}
                    </p>
                  </div>
                )}
                {isPaused && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 font-semibold flex items-center justify-center gap-1">
                    <span>⏸</span>
                    <span>Paused</span>
                  </p>
                )}
              </div>
            </div>

            {!isRunning ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
                      Select Category
                    </label>
                    <button
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <span className="text-sm">+</span>
                      <span>Add Category</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <div className="bg-slate-200 dark:bg-slate-700 rounded h-8 w-8 mb-2 animate-pulse" />
                          <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-20 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>

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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {categories.map((cat) => (
                            <div
                              key={cat.id}
                              className="relative group"
                            >
                              <button
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                                  selectedCategory === cat.name
                                    ? 'border-blue-600 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 shadow-lg scale-105 ring-2 ring-blue-200 dark:ring-blue-900'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:shadow-md'
                                }`}
                              >
                                <div className="text-2xl mb-1">{cat.icon || '📝'}</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.name}</div>
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-opacity"
                                title="Delete category"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <p className="text-sm mb-1">No categories yet. Click &quot;Add Category&quot; to create one!</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={handleStart}
                  disabled={!selectedCategory}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-bold text-sm disabled:shadow-none"
                >
                  ▶ Start Timer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {!isPaused ? (
                  <button
                    onClick={pauseTimer}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg font-bold text-sm"
                  >
                    ⏸ Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg font-bold text-sm"
                  >
                    ▶ Resume
                  </button>
                )}
                <button
                  onClick={handleRecordSession}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg font-bold text-sm"
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

        {/* Motivational Quote Section - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg shadow-lg p-6 border border-indigo-400 h-full flex flex-col justify-center">
            {currentQuote && (
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-4xl">💫</span>
                </div>
                <blockquote className="text-white mb-4">
                  <p className="text-lg font-semibold leading-relaxed italic">
                    &quot;{currentQuote.text}&quot;
                  </p>
                </blockquote>
                <p className="text-white/90 text-sm font-medium">
                  — {currentQuote.author}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
