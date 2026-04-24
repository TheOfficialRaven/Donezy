import type { Note } from './types';

/** Lightweight shape for dashboard / guidance consumers (not wired yet). */
export interface NoteGuidanceStub {
  noteId: string;
  title: string;
  type: Note['type'];
  preview: string;
  pinned: boolean;
  archived: boolean;
  updatedAt: string;
  /** Why this row might surface in a future “review” rail. */
  signal: 'inbox_candidate' | 'needs_attention' | 'pinned';
}

export interface NoteListItemBridgeStub {
  noteId: string;
  title: string;
  preview: string;
}

export interface NoteGoalSeedStub {
  noteId: string;
  title: string;
  bodyPreview: string;
}

export interface NoteReflectionTopicStub {
  noteId: string;
  title: string;
  suggestedPrompt: string;
}

/** When `futureLinkTargets.dashboardHighlightCandidate` is set (integration hook). */
export function toDashboardHighlightStub(note: Note): NoteGuidanceStub | null {
  if (!note.futureLinkTargets?.dashboardHighlightCandidate) return null;
  return {
    noteId: note.id,
    title: note.title || note.preview.slice(0, 80),
    type: note.type,
    preview: note.preview,
    pinned: note.pinned,
    archived: note.archived,
    updatedAt: note.updatedAt,
    signal: 'pinned',
  };
}

export function toListItemBridgeStub(note: Note): NoteListItemBridgeStub | null {
  if (!note.futureLinkTargets?.listItemCandidate) return null;
  return { noteId: note.id, title: note.title || 'Jegyzet', preview: note.preview };
}

export function toGoalSeedStub(note: Note): NoteGoalSeedStub | null {
  if (!note.futureLinkTargets?.goalSeedCandidate) return null;
  return { noteId: note.id, title: note.title || 'Cél javaslat', bodyPreview: note.preview };
}

export function toReflectionTopicStub(note: Note): NoteReflectionTopicStub | null {
  if (!note.futureLinkTargets?.reflectionTopicCandidate) return null;
  return {
    noteId: note.id,
    title: note.title || 'Reflexió',
    suggestedPrompt: note.preview.slice(0, 200),
  };
}
