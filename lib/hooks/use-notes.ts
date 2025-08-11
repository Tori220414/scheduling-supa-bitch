"use client"

import { useState, useEffect } from "react"
import { notesAPI } from "@/lib/api/notes"
import type { Note, CreateNoteForm, UpdateNoteForm } from "@/lib/types"
import { toast } from "sonner"

interface UseNotesOptions {
  search?: string
  tags?: string[]
  is_favorite?: boolean
  autoRefresh?: boolean
}

export function useNotes(options: UseNotesOptions = {}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: any = {}
      if (options.search) filters.search = options.search
      if (options.tags) filters.tags = options.tags
      if (options.is_favorite !== undefined) filters.is_favorite = options.is_favorite

      const data = await notesAPI.getNotes(filters)
      setNotes(data)
    } catch (err: any) {
      setError(err.message)
      toast.error("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [options.search, options.tags, options.is_favorite])

  const createNote = async (noteData: CreateNoteForm) => {
    try {
      const newNote = await notesAPI.createNote(noteData)
      setNotes((prev) => [newNote, ...prev])
      toast.success("Note created successfully")
      return newNote
    } catch (err: any) {
      toast.error("Failed to create note")
      throw err
    }
  }

  const updateNote = async (noteData: UpdateNoteForm) => {
    try {
      const updatedNote = await notesAPI.updateNote(noteData)
      setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
      toast.success("Note updated successfully")
      return updatedNote
    } catch (err: any) {
      toast.error("Failed to update note")
      throw err
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await notesAPI.deleteNote(id)
      setNotes((prev) => prev.filter((note) => note.id !== id))
      toast.success("Note deleted successfully")
    } catch (err: any) {
      toast.error("Failed to delete note")
      throw err
    }
  }

  const toggleFavorite = async (id: string) => {
    try {
      const updatedNote = await notesAPI.toggleFavorite(id)
      setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)))
      toast.success(updatedNote.is_favorite ? "Added to favorites" : "Removed from favorites")
      return updatedNote
    } catch (err: any) {
      toast.error("Failed to update favorite status")
      throw err
    }
  }

  const refresh = () => {
    fetchNotes()
  }

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    refresh,
  }
}

export function useNotesStats() {
  const [stats, setStats] = useState({
    total: 0,
    favorites: 0,
    recent: 0,
    tags_count: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await notesAPI.getNotesStats()
        setStats(data)
      } catch (err) {
        console.error("Failed to fetch notes stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}

export function useNoteTags() {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await notesAPI.getAllTags()
        setTags(data)
      } catch (err) {
        console.error("Failed to fetch tags:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  return { tags, loading }
}

export function useNoteSearch() {
  const [results, setResults] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string, limit = 20) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    try {
      setError(null)
      setLoading(true)
      const searchResults = await notesAPI.searchNotes(query, limit)
      setResults(searchResults)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setError(null)
  }

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  }
}
