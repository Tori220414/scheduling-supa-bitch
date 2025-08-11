import { getSupabase } from "@/lib/supabase-client"
import type { Note, CreateNoteForm, UpdateNoteForm } from "@/lib/types"

export class NotesAPI {
  private supabase = getSupabase()

  async getNotes(filters?: {
    search?: string
    tags?: string[]
    is_favorite?: boolean
    limit?: number
    offset?: number
  }): Promise<Note[]> {
    let query = this.supabase.from("notes").select("*").order("updated_at", { ascending: false })

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags)
    }

    if (filters?.is_favorite !== undefined) {
      query = query.eq("is_favorite", filters.is_favorite)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    return data || []
  }

  async getNote(id: string): Promise<Note | null> {
    const { data, error } = await this.supabase.from("notes").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Note not found
      }
      throw new Error(`Failed to fetch note: ${error.message}`)
    }

    return data
  }

  async createNote(noteData: CreateNoteForm): Promise<Note> {
    const { data, error } = await this.supabase
      .from("notes")
      .insert([
        {
          ...noteData,
          tags: noteData.tags || [],
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create note: ${error.message}`)
    }

    return data
  }

  async updateNote(noteData: UpdateNoteForm): Promise<Note> {
    const updateData: any = { ...noteData }
    delete updateData.id
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await this.supabase.from("notes").update(updateData).eq("id", noteData.id).select().single()

    if (error) {
      throw new Error(`Failed to update note: ${error.message}`)
    }

    return data
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await this.supabase.from("notes").delete().eq("id", id)

    if (error) {
      throw new Error(`Failed to delete note: ${error.message}`)
    }
  }

  async toggleFavorite(id: string): Promise<Note> {
    const note = await this.getNote(id)
    if (!note) {
      throw new Error("Note not found")
    }

    return this.updateNote({
      id,
      title: note.title,
      content: note.content,
      is_favorite: !note.is_favorite,
    })
  }

  async searchNotes(query: string, limit = 20): Promise<Note[]> {
    return this.getNotes({
      search: query,
      limit,
    })
  }

  async getNotesByTag(tag: string): Promise<Note[]> {
    return this.getNotes({
      tags: [tag],
    })
  }

  async getFavoriteNotes(): Promise<Note[]> {
    return this.getNotes({
      is_favorite: true,
    })
  }

  async getAllTags(): Promise<string[]> {
    const { data, error } = await this.supabase.from("notes").select("tags")

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`)
    }

    const allTags = new Set<string>()
    data?.forEach((note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    return Array.from(allTags).sort()
  }

  async getNotesStats(): Promise<{
    total: number
    favorites: number
    recent: number
    tags_count: number
  }> {
    const notes = await this.getNotes()
    const tags = await this.getAllTags()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recent = notes.filter((note) => new Date(note.updated_at) > weekAgo).length

    return {
      total: notes.length,
      favorites: notes.filter((note) => note.is_favorite).length,
      recent,
      tags_count: tags.length,
    }
  }
}

// Export singleton instance
export const notesAPI = new NotesAPI()
