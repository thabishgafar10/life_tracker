import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  CalendarDays,
} from "lucide-react";

import {
  getDailyNotes,
  createDailyNote,
  updateDailyNote,
  deleteDailyNote,
} from "../services/api";

function DailyNotes() {
  const [notes, setNotes] = useState([]);

  const [selectedNote, setSelectedNote] = useState(null);

  const [isCreating, setIsCreating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [date, setDate] = useState("");

  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);

  /* =========================================
     LOAD NOTES
  ========================================== */

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      setLoading(true);
      setError(null);

      const data = await getDailyNotes();

      const safeNotes = Array.isArray(data) ? data : [];

      setNotes(
        [...safeNotes].sort(
          (a, b) =>
            new Date(b.date) - new Date(a.date)
        )
      );
    } catch (err) {
      console.error("Failed to load notes:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load notes."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     DATE HELPERS
  ========================================== */

  function getTodayString() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatNoteDate(dateString) {
    const noteDate = new Date(
      `${dateString}T00:00:00`
    );

    return noteDate.toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getDateLabel(dateString) {
    const today = getTodayString();

    const yesterdayDate = new Date();

    yesterdayDate.setDate(
      yesterdayDate.getDate() - 1
    );

    const yesterdayYear =
      yesterdayDate.getFullYear();

    const yesterdayMonth = String(
      yesterdayDate.getMonth() + 1
    ).padStart(2, "0");

    const yesterdayDay = String(
      yesterdayDate.getDate()
    ).padStart(2, "0");

    const yesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

    if (dateString === today) {
      return "Today";
    }

    if (dateString === yesterday) {
      return "Yesterday";
    }

    return formatNoteDate(dateString);
  }

  /* =========================================
     GROUP NOTES BY DATE
  ========================================== */

  const groupedNotes = useMemo(() => {
    const groups = {};

    notes.forEach((note) => {
      if (!groups[note.date]) {
        groups[note.date] = [];
      }

      groups[note.date].push(note);
    });

    return Object.entries(groups).sort(
      (a, b) =>
        new Date(b[0]) -
        new Date(a[0])
    );
  }, [notes]);

  /* =========================================
     START CREATE
  ========================================== */

  function handleNewNote() {
    setSelectedNote(null);

    setDate(getTodayString());

    setContent("");

    setIsCreating(true);

    setIsEditing(false);

    setError(null);
  }

  /* =========================================
     START EDIT
  ========================================== */

  function handleEditNote(note) {
    setSelectedNote(note);

    setDate(note.date);

    setContent(note.content || "");

    setIsEditing(true);

    setIsCreating(false);

    setError(null);
  }

  /* =========================================
     CANCEL EDIT
  ========================================== */

  function handleCancelEditor() {
    setIsCreating(false);

    setIsEditing(false);

    setSelectedNote(null);

    setDate("");

    setContent("");

    setError(null);
  }

  /* =========================================
     SAVE NOTE
  ========================================== */

  async function handleSaveNote(event) {
    event.preventDefault();

    if (!date) {
      setError("Please select a date.");

      return;
    }

    if (!content.trim()) {
      setError("Please write something in your note.");

      return;
    }

    try {
      setSaving(true);

      setError(null);

      const noteData = {
        date,
        content: content.trim(),
      };

      if (isEditing && selectedNote) {
        const updatedNote =
          await updateDailyNote(
            selectedNote.id,
            noteData
          );

        setNotes((currentNotes) =>
          currentNotes
            .map((note) =>
              note.id === updatedNote.id
                ? updatedNote
                : note
            )
            .sort(
              (a, b) =>
                new Date(b.date) -
                new Date(a.date)
            )
        );

        setSelectedNote(updatedNote);
      } else {
        const newNote =
          await createDailyNote(noteData);

        setNotes((currentNotes) =>
          [...currentNotes, newNote].sort(
            (a, b) =>
              new Date(b.date) -
              new Date(a.date)
          )
        );

        setSelectedNote(newNote);
      }

      setIsCreating(false);

      setIsEditing(false);

      setDate("");

      setContent("");
    } catch (err) {
      console.error("Failed to save note:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save note."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DELETE NOTE
  ========================================== */

  async function handleDeleteNote(note) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteDailyNote(note.id);

      setNotes((currentNotes) =>
        currentNotes.filter(
          (currentNote) =>
            currentNote.id !== note.id
        )
      );

      if (
        selectedNote &&
        selectedNote.id === note.id
      ) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete note."
      );
    }
  }

  /* =========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="notes-page-loading">
        Loading your notes...
      </div>
    );
  }

  /* =========================================
     RENDER
  ========================================== */

  return (
    <div className="notes-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="notes-header">

        <div>
          <h1>Notes</h1>

          <p>
            Write and manage your daily notes.
          </p>
        </div>

        {!isCreating && !isEditing && (
          <button
            className="notes-new-button"
            type="button"
            onClick={handleNewNote}
          >
            <Plus size={17} />

            New Note
          </button>
        )}

      </header>


      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="notes-error">
          {error}
        </div>
      )}


      {/* =====================================
          EDITOR
      ====================================== */}

      {(isCreating || isEditing) && (
        <section className="notes-editor-card">

          <div className="notes-editor-header">

            <div>
              <h2>
                {isEditing
                  ? "Edit Note"
                  : "New Note"}
              </h2>

              <p>
                Add a thought, reflection, or
                reminder for the day.
              </p>
            </div>

            <button
              className="notes-close-button"
              type="button"
              onClick={handleCancelEditor}
              disabled={saving}
              aria-label="Close editor"
            >
              <X size={18} />
            </button>

          </div>


          <form
            className="notes-editor-form"
            onSubmit={handleSaveNote}
          >

            <div className="notes-form-row">

              <label>
                <span>Date</span>

                <div className="notes-date-input">

                  <CalendarDays size={16} />

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    disabled={saving}
                  />

                </div>

              </label>

            </div>


            <label className="notes-content-label">

              <span>Note</span>

              <textarea
                rows={7}
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Write your thoughts..."
                disabled={saving}
              />

            </label>


            <div className="notes-editor-actions">

              <button
                className="notes-cancel-button"
                type="button"
                onClick={handleCancelEditor}
                disabled={saving}
              >
                Cancel
              </button>


              <button
                className="notes-save-button"
                type="submit"
                disabled={saving}
              >
                <Save size={16} />

                {saving
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Save Note"}
              </button>

            </div>

          </form>

        </section>
      )}


      {/* =====================================
          MAIN NOTES AREA
      ====================================== */}

      {!isCreating && !isEditing && (
        <section className="notes-layout">

          {/* =================================
              NOTE LIST
          ================================== */}

          <div className="notes-list-panel">

            <div className="notes-list-header">
              <h2>All Notes</h2>

              <span>
                {notes.length}
                {" "}
                {notes.length === 1
                  ? "note"
                  : "notes"}
              </span>
            </div>


            {notes.length === 0 ? (

              <div className="notes-empty-state">

                <div className="notes-empty-icon">
                  <Plus size={20} />
                </div>

                <h3>
                  No notes yet
                </h3>

                <p>
                  Start writing your first
                  daily note.
                </p>

                <button
                  type="button"
                  onClick={handleNewNote}
                >
                  Create Note
                </button>

              </div>

            ) : (

              <div className="notes-list">

                {groupedNotes.map(
                  ([noteDate, dateNotes]) => (

                    <div
                      className="notes-date-group"
                      key={noteDate}
                    >

                      <div className="notes-date-heading">
                        {getDateLabel(noteDate)}
                      </div>


                      {dateNotes.map((note) => (

                        <button
                          className={`note-list-item ${
                            selectedNote?.id ===
                            note.id
                              ? "selected"
                              : ""
                          }`}
                          type="button"
                          key={note.id}
                          onClick={() =>
                            setSelectedNote(note)
                          }
                        >

                          <div className="note-list-item-top">

                            <span>
                              {formatNoteDate(
                                note.date
                              )}
                            </span>

                          </div>


                          <p>
                            {note.content}
                          </p>

                        </button>

                      ))}

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* =================================
              NOTE DETAIL
          ================================== */}

          <div className="notes-detail-panel">

            {selectedNote ? (

              <>

                <div className="notes-detail-header">

                  <div>

                    <span>
                      {getDateLabel(
                        selectedNote.date
                      )}
                    </span>

                    <h2>
                      {formatNoteDate(
                        selectedNote.date
                      )}
                    </h2>

                  </div>


                  <div className="notes-detail-actions">

                    <button
                      type="button"
                      onClick={() =>
                        handleEditNote(
                          selectedNote
                        )
                      }
                      aria-label="Edit note"
                      title="Edit note"
                    >
                      <Pencil size={16} />
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteNote(
                          selectedNote
                        )
                      }
                      aria-label="Delete note"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>


                <div className="notes-detail-content">

                  {selectedNote.content}

                </div>

              </>

            ) : (

              <div className="notes-detail-empty">

                <div className="notes-empty-icon">
                  <CalendarDays size={22} />
                </div>

                <h3>
                  Select a note
                </h3>

                <p>
                  Choose a note from the list
                  to view it here.
                </p>

              </div>

            )}

          </div>

        </section>
      )}

    </div>
  );
}

export default DailyNotes;