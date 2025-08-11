export interface Note {
  id: string
  user_id: string
  title: string
  content: string | null
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface CreateNoteForm {
  title: string
  content?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface UpdateNoteForm extends Partial<CreateNoteForm> {
  id: string
}
