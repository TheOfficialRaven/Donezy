import type { QuickCaptureItem, QuickCaptureSuggestion } from './types';

function hasAny(text: string, parts: string[]) {
  return parts.some((part) => text.includes(part));
}

export function suggestQuickCaptureRouting(rawInput: string): QuickCaptureSuggestion {
  const text = rawInput.trim().toLowerCase();
  if (!text) {
    return { confidence: 0, reason: 'empty-input' };
  }

  if (hasAny(text, ['holnap', 'ma', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap', ':', 'óra'])) {
    return {
      suggestedType: 'event_seed',
      suggestedTargetModule: 'calendar',
      confidence: 0.7,
      reason: 'time-or-date-pattern',
    };
  }

  if (hasAny(text, ['olvas', 'könyv', 'fejezet', 'quote', 'idézet'])) {
    return {
      suggestedType: 'reading_seed',
      suggestedTargetModule: 'reading',
      confidence: 0.75,
      reason: 'reading-keywords',
    };
  }

  if (hasAny(text, ['szokás', 'minden nap', 'rutin', 'reggel', 'este'])) {
    return {
      suggestedType: 'habit_seed',
      suggestedTargetModule: 'habits',
      confidence: 0.66,
      reason: 'habit-keywords',
    };
  }

  if (hasAny(text, ['cél', 'el akarom érni', 'hónap végéig', 'kellene'])) {
    return {
      suggestedType: 'goal_seed',
      suggestedTargetModule: 'goals',
      confidence: 0.68,
      reason: 'goal-keywords',
    };
  }

  if (hasAny(text, ['küldetés', 'mission', 'mai lépés'])) {
    return {
      suggestedType: 'mission_seed',
      suggestedTargetModule: 'missions',
      confidence: 0.62,
      reason: 'mission-keywords',
    };
  }

  if (hasAny(text, ['hálás', 'tanulság', 'ma úgy érzem', 'reflexió'])) {
    return {
      suggestedType: 'reflection_seed',
      suggestedTargetModule: 'reflection',
      confidence: 0.65,
      reason: 'reflection-keywords',
    };
  }

  if (text.length >= 90 || hasAny(text, ['ötlet', 'gondolat', 'jegyzet'])) {
    return {
      suggestedType: 'note',
      suggestedTargetModule: 'notes',
      confidence: 0.6,
      reason: 'long-thought-or-note-keyword',
    };
  }

  return {
    suggestedType: 'list_item',
    suggestedTargetModule: 'lists',
    confidence: 0.55,
    reason: 'default-task-candidate',
  };
}

export function applyCaptureSuggestion(item: QuickCaptureItem): QuickCaptureItem {
  const suggestion = suggestQuickCaptureRouting(item.rawInput);
  return {
    ...item,
    suggestedType: suggestion.suggestedType,
    suggestedTargetModule: suggestion.suggestedTargetModule,
    extractedMetadata: {
      ...(item.extractedMetadata || {}),
      routingConfidence: suggestion.confidence,
      routingReason: suggestion.reason,
    },
  };
}
