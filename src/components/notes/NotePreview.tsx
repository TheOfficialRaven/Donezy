import { cn } from '@/lib/utils';

export default function NotePreview({
  text,
  className,
  lines = 3,
}: {
  text: string;
  className?: string;
  lines?: 2 | 3 | 4;
}) {
  const clamp =
    lines === 2 ? 'line-clamp-2' : lines === 4 ? 'line-clamp-4' : 'line-clamp-3';
  return (
    <p className={cn('text-sm text-text-secondary leading-relaxed', clamp, className)}>
      {text || '—'}
    </p>
  );
}
