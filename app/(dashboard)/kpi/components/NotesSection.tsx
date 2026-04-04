"use client";

import { useState } from "react";
import { useNotes, useAddNote, useDeleteNote } from "@/lib/hooks/useKPI";
import { motion } from "framer-motion";

interface NotesSectionProps {
  kpiId: string;
}

export function NotesSection({ kpiId }: NotesSectionProps) {
  const { data: notes, isLoading } = useNotes(kpiId);
  const addNote = useAddNote(kpiId);
  const deleteNote = useDeleteNote(kpiId);
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newNote.trim()) {
      setError("Note cannot be empty");
      return;
    }

    try {
      await addNote.mutateAsync({
        content: newNote,
      });
      setNewNote("");
    } catch (err: any) {
      setError(err.message || "Failed to add note");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate(noteId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-text-primary">Notes</h3>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-2">
        {error && (
          <div className="p-2 bg-danger/10 border border-danger text-danger rounded text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={addNote.isPending || !newNote.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <p className="text-text-secondary text-sm">Loading notes...</p>
        ) : !notes || notes.length === 0 ? (
          <p className="text-text-tertiary text-sm">No notes yet</p>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-neutral-50 border border-border rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary break-words">{note.content}</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {note.createdBy || "Author"} • {formatDate(note.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-danger hover:text-danger-dark text-xs font-medium flex-shrink-0"
                  title="Delete note"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
