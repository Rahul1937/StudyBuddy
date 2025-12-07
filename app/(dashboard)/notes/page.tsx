'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()
      setNotes(data.notes || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent }),
      })

      if (response.ok) {
        setNewNoteContent('')
        fetchNotes()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (response.ok) {
        setEditingId(null)
        setEditContent('')
        fetchNotes()
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      fetchNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400 font-medium">Loading notes...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Notes</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Create and manage your study notes</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="mb-6">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write a new note..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 font-medium"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNoteContent.trim() || isAdding}
            className="mt-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg disabled:shadow-none"
          >
            Add Note
          </button>
        </div>

        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8 font-medium">No notes yet. Create your first note!</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold shadow-md"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditContent('')
                        }}
                        className="bg-slate-600 dark:bg-slate-700 text-white px-5 py-2 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap mb-3 font-medium leading-relaxed">{note.content}</p>
                    <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

