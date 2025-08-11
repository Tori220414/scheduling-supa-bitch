"use client"
import type { Note } from "@/lib/types"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Edit, Trash2, Hash } from "lucide-react"
import { format } from "date-fns"

interface NoteItemProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export function NoteItem({ note, onEdit, onDelete, onToggleFavorite }: NoteItemProps) {
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(note.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(note)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this note?")) {
      onDelete(note.id)
    }
  }

  const truncateContent = (content: string | null, maxLength = 150) => {
    if (!content) return ""
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => onEdit(note)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{note.title}</h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleToggleFavorite}
              title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-4 w-4 ${note.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleEdit} title="Edit note">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              title="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {note.content && <p className="text-gray-600 text-sm mb-4 line-clamp-4">{truncateContent(note.content)}</p>}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated {format(new Date(note.updated_at), "MMM d, yyyy")}</span>
          {note.is_favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
        </div>
      </CardContent>
    </Card>
  )
}
