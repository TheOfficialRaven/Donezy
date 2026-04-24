import { ROUTING_COPY } from './constants';
import type { RoutingCandidate } from './types';

function createId(prefix: string, sourceId: string, target: string) {
  return `${prefix}-${sourceId}-${target}`;
}

export function quickCaptureToRoutingCandidates(item: {
  id: string;
  rawInput: string;
  suggestedTargetModule?: string;
  suggestedType?: string;
}): RoutingCandidate[] {
  const text = item.rawInput.trim();
  if (!text) return [];
  const candidates: RoutingCandidate[] = [];
  const lower = text.toLowerCase();

  if (/\d{1,2}:\d{2}|holnap|ma|hetfo|kedd|szerda|csutortok|pentek|szombat|vasarnap/.test(lower)) {
    candidates.push({
      id: createId('capture', item.id, 'calendar'),
      sourceModule: 'capture',
      sourceEntityType: 'quick-capture-item',
      sourceEntityId: item.id,
      candidateType: 'event-seed',
      targetModule: 'calendar',
      title: text,
      reason: ROUTING_COPY.eventSeed,
      confidence: 0.84,
      suggestedPayload: { title: text, sourceCaptureId: item.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  }

  if (text.split(/\s+/).length <= 6) {
    candidates.push({
      id: createId('capture', item.id, 'lists'),
      sourceModule: 'capture',
      sourceEntityType: 'quick-capture-item',
      sourceEntityId: item.id,
      candidateType: 'list-item-seed',
      targetModule: 'lists',
      title: text,
      reason: ROUTING_COPY.listSeed,
      confidence: 0.8,
      suggestedPayload: { title: text, sourceCaptureId: item.id, priority: 'medium' },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  } else {
    candidates.push({
      id: createId('capture', item.id, 'notes'),
      sourceModule: 'capture',
      sourceEntityType: 'quick-capture-item',
      sourceEntityId: item.id,
      candidateType: 'note-seed',
      targetModule: 'notes',
      title: text.slice(0, 72),
      reason: ROUTING_COPY.noteSeed,
      confidence: 0.78,
      suggestedPayload: { title: text.slice(0, 64), content: text, sourceCaptureId: item.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  }

  if (/cel|projekt|milestone|hosszabb/.test(lower)) {
    candidates.push({
      id: createId('capture', item.id, 'goals'),
      sourceModule: 'capture',
      sourceEntityType: 'quick-capture-item',
      sourceEntityId: item.id,
      candidateType: 'goal-seed',
      targetModule: 'goals',
      title: text.slice(0, 72),
      reason: ROUTING_COPY.goalSeed,
      confidence: 0.74,
      suggestedPayload: { title: text.slice(0, 64), description: text, sourceCaptureId: item.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  }

  return candidates;
}

export function noteToRoutingCandidates(note: { id: string; title: string; content: string; type?: string }): RoutingCandidate[] {
  const text = `${note.title} ${note.content}`.toLowerCase();
  const out: RoutingCandidate[] = [];
  if (note.type === 'idea' || /teendo|feladat|megcsinalni|task/.test(text)) {
    out.push({
      id: createId('note', note.id, 'lists'),
      sourceModule: 'notes',
      sourceEntityType: 'note',
      sourceEntityId: note.id,
      candidateType: 'list-item-seed',
      targetModule: 'lists',
      title: note.title || note.content.slice(0, 72),
      reason: ROUTING_COPY.listSeed,
      confidence: 0.77,
      suggestedPayload: { title: note.title || note.content.slice(0, 64), description: note.content, sourceNoteId: note.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  }
  if (/miert|tanulsag|felismer/.test(text)) {
    out.push({
      id: createId('note', note.id, 'reflection'),
      sourceModule: 'notes',
      sourceEntityType: 'note',
      sourceEntityId: note.id,
      candidateType: 'reflection-topic',
      targetModule: 'reflection',
      title: note.title || 'Reflexios tema',
      reason: ROUTING_COPY.reflectionSeed,
      confidence: 0.7,
      suggestedPayload: { title: note.title || 'Reflexios tema', content: note.content, sourceNoteId: note.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  }
  return out;
}

export function readingToRoutingCandidates(entry: { id: string; lesson?: string; quote?: string; note?: string; bookId: string }): RoutingCandidate[] {
  const out: RoutingCandidate[] = [];
  if (entry.lesson || entry.quote) {
    out.push({
      id: createId('reading', entry.id, 'notes'),
      sourceModule: 'reading',
      sourceEntityType: 'reading-entry',
      sourceEntityId: entry.id,
      candidateType: 'reading-note-candidate',
      targetModule: 'notes',
      title: entry.lesson?.slice(0, 72) || entry.quote?.slice(0, 72) || 'Olvasasi tanulsag',
      reason: ROUTING_COPY.noteSeed,
      confidence: 0.86,
      suggestedPayload: { title: 'Olvasasi tanulsag', content: `${entry.lesson || ''}\n${entry.quote || ''}`.trim(), sourceReadingEntryId: entry.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: entry.note || '',
    });
  }
  return out;
}

export function goalToRoutingCandidates(goal: { id: string; title: string; milestones?: Array<{ id: string; title: string; dueDate?: string; completed?: boolean }> }): RoutingCandidate[] {
  const out: RoutingCandidate[] = [];
  const openMilestone = (goal.milestones || []).find((m) => !m.completed);
  if (openMilestone) {
    out.push({
      id: createId('goal', goal.id, 'missions'),
      sourceModule: 'goals',
      sourceEntityType: 'goal',
      sourceEntityId: goal.id,
      candidateType: 'mission-seed',
      targetModule: 'missions',
      title: `${goal.title}: ${openMilestone.title}`,
      reason: ROUTING_COPY.missionSeed,
      confidence: 0.74,
      suggestedPayload: { title: openMilestone.title, description: `Celhoz kapcsolodo lepes: ${goal.title}`, sourceGoalId: goal.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    });
  }
  return out;
}

export function reflectionToRoutingCandidates(reflection: { id: string; content?: string; lessons?: string }): RoutingCandidate[] {
  const text = `${reflection.content || ''} ${reflection.lessons || ''}`.toLowerCase();
  if (!/kovetkezo|holnap|megteszem|lepes/.test(text)) return [];
  return [
    {
      id: createId('reflection', reflection.id, 'notes'),
      sourceModule: 'reflection',
      sourceEntityType: 'reflection-entry',
      sourceEntityId: reflection.id,
      candidateType: 'note-seed',
      targetModule: 'notes',
      title: 'Reflexios kovetkezo lepes',
      reason: ROUTING_COPY.noteSeed,
      confidence: 0.72,
      suggestedPayload: { title: 'Reflexios kovetkezo lepes', content: `${reflection.lessons || reflection.content || ''}`.trim(), sourceReflectionId: reflection.id },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    },
  ];
}

export function listToRoutingCandidates(list: {
  id: string;
  title: string;
  tasks: Array<{ id: string; title: string; completed: boolean; createdAt?: string }>;
}): RoutingCandidate[] {
  const completedTasks = list.tasks.filter((task) => task.completed && task.title.trim().length > 0);
  if (completedTasks.length < 6) return [];

  const normalizeTitle = (title: string) =>
    title
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ');

  const routineKeyword = /\b(napi|heti|reggel|este|rutin|routine|szokas)\b/i;
  const hasRoutineHint = routineKeyword.test(list.title) || completedTasks.some((task) => routineKeyword.test(task.title));

  const frequency = new Map<string, number>();
  for (const task of completedTasks) {
    const key = normalizeTitle(task.title);
    frequency.set(key, (frequency.get(key) || 0) + 1);
  }
  const repeatedClusterCount = [...frequency.values()].filter((count) => count >= 2).length;

  // Only suggest habit-signal when there is clear repeated behavior,
  // not just many one-off completed list items.
  if (!hasRoutineHint && repeatedClusterCount === 0) return [];

  const strongestCluster = [...frequency.entries()].sort((a, b) => b[1] - a[1])[0];
  const suggestedHabitTitle =
    strongestCluster && strongestCluster[1] >= 2
      ? strongestCluster[0].replace(/^\w/, (char) => char.toUpperCase())
      : `${list.title} rutin`;

  return [
    {
      id: createId('list', list.id, 'habits'),
      sourceModule: 'lists',
      sourceEntityType: 'list',
      sourceEntityId: list.id,
      candidateType: 'habit-signal',
      targetModule: 'habits',
      title: `${list.title}: ismetlodo minta`,
      reason: 'Ebben a listaban mar tobb visszatero lepes latszik.',
      confidence: 0.68,
      suggestedPayload: {
        title: suggestedHabitTitle,
        description: 'A lista alapjan lehet belole egy konnyu karbantarto szokas.',
        sourceListId: list.id,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    },
  ];
}

export function habitToRoutingCandidates(habit: { id: string; title: string; active: boolean; updatedAt: string }): RoutingCandidate[] {
  if (!habit.active) return [];
  return [
    {
      id: createId('habit', habit.id, 'missions'),
      sourceModule: 'habits',
      sourceEntityType: 'habit',
      sourceEntityId: habit.id,
      candidateType: 'mission-seed',
      targetModule: 'missions',
      title: `${habit.title} karbantarto lepes`,
      reason: 'Ezt erdemes lehet konkret heti kuldetesre bontani.',
      confidence: 0.64,
      suggestedPayload: {
        title: `${habit.title} heti karbantartas`,
        description: `Karbantarto kuldetes a(z) ${habit.title} szokashoz.`,
        sourceHabitId: habit.id,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    },
  ];
}

export function calendarToRoutingCandidates(event: { id: string; title: string; date: string; type?: string }): RoutingCandidate[] {
  const lower = event.title.toLowerCase();
  if (!/deadline|vizsga|bemutato|meeting|prezentacio|hatarido/.test(lower) && event.type !== 'deadline') return [];
  return [
    {
      id: createId('calendar', event.id, 'lists'),
      sourceModule: 'calendar',
      sourceEntityType: 'event',
      sourceEntityId: event.id,
      candidateType: 'list-item-seed',
      targetModule: 'lists',
      title: `${event.title} elokeszites`,
      reason: 'Ehhez az esemenyhez hasznos lehet egy konkret teendo.',
      confidence: 0.73,
      suggestedPayload: {
        title: `${event.title} elokeszites`,
        description: 'Naptar esemenybol ajanlott kovetkezo lepes.',
        dueDate: event.date,
        sourceEventId: event.id,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      description: '',
    },
  ];
}
