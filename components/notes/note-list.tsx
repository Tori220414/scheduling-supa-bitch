"use client"
import { useState } from "react"
import type { Note } from "@/lib/types"
import { NoteItem } from "./note-item"
import { NoteForm } from "./note-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNotes, useNoteTags } from "@/lib/hooks/use-notes"
import { Plus, Search, Filter, Star, Hash } from "lucide-react"

export function NoteList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [showFavorites, setShowFavorites] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  const { notes, loading, createNote, updateNote, deleteNote, toggleFavorite } = useNotes({
    search: searchTerm,
    tags: selectedTag !== "all" ? [selectedTag] : undefined,
    is_favorite: showFavorites || undefined,
  })

  const { tags } = useNoteTags()

  const handleCreateNote = () => {
    setSelectedNote(null)
    setShowForm(true)
  }

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setShowForm(true)
  }

  const handleFormSubmit = async (data: any) => {
    if (selectedNote) {
      await updateNote(data)
    } else {
      await createNote(data)
    }
    setShowForm(false)
    setSelectedNote(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedNote(null)
  }

  const getFilteredNotes = () => {
    let filtered = notes

    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }

  const filteredNotes = getFilteredNotes()

  const getTagCounts = () => {
    const counts: Record<string, number> = {}
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return counts
  }

  const tagCounts = getTagCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notes</h2>
          <p className="text-muted-foreground">Capture and organize your thoughts</p>
        </div>
        <Button onClick={handleCreateNote}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setShowFavorites(false)}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{notes.length}</div>
            <div className="text-sm text-muted-foreground">All Notes</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setShowFavorites(true)}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{notes.filter((n) => n.is_favorite).length}</div>
            <div className="text-sm text-muted-foreground">Favorites</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tags.length}</div>
            <div className="text-sm text-muted-foreground">Tags</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {notes.filter((n) => new Date(n.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-sm text-muted-foreground">Recent</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      {tag}
                      <Badge variant="secondary" className="ml-auto">
                        {tagCounts[tag]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFavorites ? "default" : "outline"}
              onClick={() => setShowFavorites(!showFavorites)}
              className="w-full md:w-auto"
            >
              <Star className={`h-4 w-4 mr-2 ${showFavorites ? "fill-current" : ""}`} />
              Favorites
            </Button>
          </div>
          {(selectedTag !== "all" || showFavorites || searchTerm) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedTag !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTag("all")}>
                  Tag: {selectedTag} ×
                </Badge>
              )}
              {showFavorites && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setShowFavorites(false)}>
                  Favorites ×
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm("")}>
                  Search: "{searchTerm}" ×
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  {notes.length === 0 ? "No notes yet" : "No notes match your filters"}
                </div>
                <Button onClick={handleCreateNote} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Note
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={deleteNote}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      {/* Note Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <NoteForm note={selectedNote} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
