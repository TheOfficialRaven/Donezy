import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Star, ChevronRight, Pencil, Trash2,
  Quote, Lightbulb, BarChart3, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAppStore, type Book } from '@/stores/useAppStore';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

// ---- Book cover colors for visual variety ----
const COVER_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#2563eb', '#7c3aed', '#059669',
];

const GENRES = [
  'Önfejlesztés', 'Pszichológia', 'Üzlet', 'Tudomány',
  'Filozófia', 'Történelem', 'Regény', 'Életrajz',
  'Egészség', 'Spiritualitás', 'Technológia', 'Egyéb',
];

type Tab = 'shelf' | 'reading' | 'completed' | 'wishlist';

export default function ReadingJournal() {
  const { books, readingLogs, addBook, updateBook, deleteBook, logReading } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [logDialogBook, setLogDialogBook] = useState<Book | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  const reading = books.filter((b) => b.status === 'reading');
  const completed = books.filter((b) => b.status === 'completed');
  const wishlist = books.filter((b) => b.status === 'want-to-read');

  const totalPagesRead = useMemo(
    () => readingLogs.reduce((sum, l) => sum + l.pagesRead, 0),
    [readingLogs]
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'shelf', label: 'Könyvespolc', count: books.length },
    { key: 'reading', label: 'Olvasom', count: reading.length },
    { key: 'completed', label: 'Kész', count: completed.length },
    { key: 'wishlist', label: 'Olvasnám', count: wishlist.length },
  ];

  const displayBooks = activeTab === 'shelf' ? books
    : activeTab === 'reading' ? reading
    : activeTab === 'completed' ? completed
    : wishlist;

  const handleDeleteBook = async () => {
    if (bookToDelete) {
      await deleteBook(bookToDelete);
      toast.success('Könyv törölve.');
      setDeleteConfirmOpen(false);
      setBookToDelete(null);
      if (detailBook?.id === bookToDelete) setDetailBook(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Olvasási napló
          </h1>
          <p className="text-text-secondary mt-1">
            {books.length} könyv · {totalPagesRead.toLocaleString()} oldal elolvasva
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-surface-0"
          onClick={() => { setEditingBook(null); setBookDialogOpen(true); }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Új könyv
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Éppen olvasom', value: reading.length, color: 'text-primary' },
          { label: 'Elolvasva', value: completed.length, color: 'text-emerald-400' },
          { label: 'Összes oldal', value: totalPagesRead.toLocaleString(), color: 'text-blue-400' },
          { label: 'Olvasnám', value: wishlist.length, color: 'text-orange-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass p-4">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-2/50 rounded-lg p-1 gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 px-1.5 sm:px-3 py-2 rounded-md text-[11px] sm:text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-primary text-surface-0 shadow-lg'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            <span className="ml-0.5 sm:ml-1 opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Bookshelf */}
      {displayBooks.length > 0 ? (
        <Bookshelf
          books={displayBooks}
          onSelect={setDetailBook}
          onLogReading={setLogDialogBook}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass p-12 text-center">
            <BookOpen className="h-16 w-16 text-text-disabled mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
              {activeTab === 'shelf' ? 'A könyvespolcod még üres' : 'Nincs könyv ebben a kategóriában'}
            </h3>
            <p className="text-text-muted mb-4">Adj hozzá könyveket és kezdj el olvasni!</p>
            <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => { setEditingBook(null); setBookDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Első könyv hozzáadása
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Book detail side panel */}
      <AnimatePresence>
        {detailBook && (
          <BookDetail
            book={detailBook}
            readingLogs={readingLogs.filter((l) => l.bookId === detailBook.id)}
            onClose={() => setDetailBook(null)}
            onEdit={() => { setEditingBook(detailBook); setBookDialogOpen(true); }}
            onDelete={() => { setBookToDelete(detailBook.id); setDeleteConfirmOpen(true); }}
            onLogReading={() => setLogDialogBook(detailBook)}
          />
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <BookDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        book={editingBook}
        onSaved={(b) => { if (detailBook?.id === b.id) setDetailBook({ ...detailBook, ...b }); }}
      />
      <LogReadingDialog book={logDialogBook} onClose={() => setLogDialogBook(null)} />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Könyv törlése"
        description="Biztosan törölni szeretnéd ezt a könyvet és minden hozzá tartozó olvasási naplót?"
        confirmLabel="Törlés"
        onConfirm={handleDeleteBook}
        destructive
      />
    </div>
  );
}

// ============ BOOKSHELF COMPONENT ============

function Bookshelf({ books, onSelect, onLogReading }: {
  books: Book[];
  onSelect: (b: Book) => void;
  onLogReading: (b: Book) => void;
}) {
  // Group into shelves of max 6 books
  const shelves: Book[][] = [];
  for (let i = 0; i < books.length; i += 6) {
    shelves.push(books.slice(i, i + 6));
  }

  return (
    <div className="space-y-2">
      {shelves.map((shelf, si) => (
        <motion.div
          key={si}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
        >
          {/* Books row */}
          <div className="flex items-end gap-3 px-4 pb-0 min-h-[180px] flex-wrap justify-center sm:justify-start">
            {shelf.map((book, bi) => (
              <BookSpine key={book.id} book={book} index={bi} onSelect={onSelect} onLogReading={onLogReading} />
            ))}
          </div>
          {/* Shelf board */}
          <div className="relative">
            <div className="h-3 bg-gradient-to-b from-amber-800/80 to-amber-900/90 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />
            <div className="h-1 bg-amber-950/60" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BookSpine({ book, index, onSelect, onLogReading }: {
  book: Book;
  index: number;
  onSelect: (b: Book) => void;
  onLogReading: (b: Book) => void;
}) {
  const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
  const isCompleted = book.status === 'completed';
  const thickness = Math.max(28, Math.min(50, book.totalPages / 8));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative cursor-pointer flex-shrink-0"
      style={{ width: thickness }}
      onClick={() => onSelect(book)}
    >
      {/* Book body */}
      <div
        className="relative rounded-sm shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl"
        style={{
          backgroundColor: book.coverColor,
          height: Math.max(140, Math.min(180, 140 + book.totalPages / 10)),
          width: thickness,
        }}
      >
        {/* Title on spine */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-1">
          <span
            className="text-white/90 font-bold leading-tight text-center"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: Math.max(8, Math.min(11, thickness / 4)),
              maxHeight: '90%',
              overflow: 'hidden',
            }}
          >
            {book.title}
          </span>
        </div>

        {/* Spine highlight */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/20 rounded-l-sm" />

        {/* Progress indicator at bottom */}
        {!isCompleted && book.status === 'reading' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 rounded-b-sm overflow-hidden">
            <div className="h-full bg-white/70 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Completed checkmark */}
        {isCompleted && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow">
            <Star className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-surface-1 border border-white/10 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
          <p className="text-xs font-medium text-text-primary">{book.title}</p>
          <p className="text-xs text-text-muted">{book.author}</p>
          {book.status === 'reading' && (
            <p className="text-xs text-primary mt-0.5">{book.currentPage}/{book.totalPages} oldal ({Math.round(progress)}%)</p>
          )}
        </div>
      </div>

      {/* Quick log button on hover */}
      {book.status === 'reading' && (
        <button
          onClick={(e) => { e.stopPropagation(); onLogReading(book); }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
          title="Olvasás naplózása"
        >
          <Plus className="h-3 w-3 text-surface-0" />
        </button>
      )}
    </motion.div>
  );
}

// ============ BOOK DETAIL PANEL ============

function BookDetail({ book, readingLogs: logs, onClose, onEdit, onDelete, onLogReading }: {
  book: Book;
  readingLogs: { id: string; date: string; pagesRead: number; note?: string }[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogReading: () => void;
}) {
  const { updateBook } = useAppStore();
  const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState(book.summary || '');
  const [newQuote, setNewQuote] = useState('');
  const [newLesson, setNewLesson] = useState('');

  const saveSummary = async () => {
    await updateBook(book.id, { summary: summaryText });
    setSummaryOpen(false);
    toast.success('Összesítő mentve!');
  };

  const addQuote = async () => {
    if (!newQuote.trim()) return;
    const quotes = [...(book.favoriteQuotes || []), newQuote.trim()];
    await updateBook(book.id, { favoriteQuotes: quotes });
    setNewQuote('');
  };

  const addLesson = async () => {
    if (!newLesson.trim()) return;
    const lessons = [...(book.keyLessons || []), newLesson.trim()];
    await updateBook(book.id, { keyLessons: lessons });
    setNewLesson('');
  };

  const setRating = async (r: number) => {
    await updateBook(book.id, { rating: r });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[420px] glass-intense border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 pb-20 sm:pb-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {/* Mini book cover */}
            <div
              className="w-14 h-20 rounded-sm shadow-lg flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: book.coverColor }}
            >
              <BookOpen className="h-6 w-6 text-white/70" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-text-primary">{book.title}</h2>
              <p className="text-text-secondary">{book.author}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-xs bg-surface-2/50 text-text-muted border-white/10">{book.genre}</Badge>
                <Badge className={cn('text-xs',
                  book.status === 'reading' && 'bg-primary/20 text-primary border-primary/30',
                  book.status === 'completed' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  book.status === 'want-to-read' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                )}>
                  {book.status === 'reading' ? 'Olvasom' : book.status === 'completed' ? 'Kész' : 'Olvasnám'}
                </Badge>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">Haladás</span>
            <span className="text-text-primary font-medium">{book.currentPage} / {book.totalPages} oldal</span>
          </div>
          <Progress value={progress} className="h-3 bg-surface-2" />
          <p className="text-xs text-text-muted mt-1 text-right">{Math.round(progress)}%</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {book.status === 'reading' && (
            <Button onClick={onLogReading} className="flex-1 bg-primary hover:bg-primary/90 text-surface-0" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Olvasás naplózása
            </Button>
          )}
          <Button onClick={onEdit} variant="outline" size="sm" className="border-white/20 text-text-primary hover:bg-white/5">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button onClick={onDelete} variant="outline" size="sm" className="border-white/20 text-danger hover:bg-danger/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Rating */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Értékelés</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                <Star className={cn('h-6 w-6', (book.rating || 0) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-text-muted')} />
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Összesítő
            </h3>
            <button onClick={() => { setSummaryText(book.summary || ''); setSummaryOpen(!summaryOpen); }} className="text-xs text-primary hover:underline">
              {book.summary ? 'Szerkesztés' : 'Hozzáadás'}
            </button>
          </div>
          {summaryOpen ? (
            <div className="space-y-2">
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Miről szól a könyv? Mit tanultam belőle?"
                rows={4}
                className="w-full bg-surface-0/50 border border-white/10 rounded-lg p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setSummaryOpen(false)}>Mégse</Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-surface-0" onClick={saveSummary}>Mentés</Button>
              </div>
            </div>
          ) : book.summary ? (
            <p className="text-sm text-text-secondary bg-surface-2/30 rounded-lg p-3">{book.summary}</p>
          ) : (
            <p className="text-xs text-text-muted italic">Még nincs összesítő.</p>
          )}
        </div>

        {/* Favorite Quotes */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Quote className="h-4 w-4" /> Kedvenc idézetek
          </h3>
          {(book.favoriteQuotes || []).length > 0 && (
            <div className="space-y-2 mb-3">
              {book.favoriteQuotes!.map((q, i) => (
                <div key={i} className="bg-surface-2/30 rounded-lg p-3 text-sm text-text-secondary italic border-l-2 border-primary/40">
                  "{q}"
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              placeholder="Új idézet..."
              className="bg-surface-0/50 border-white/10 text-text-primary text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') addQuote(); }}
            />
            <Button size="sm" onClick={addQuote} disabled={!newQuote.trim()} className="bg-primary/20 text-primary hover:bg-primary/30">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Lessons */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> Tanulságok
          </h3>
          {(book.keyLessons || []).length > 0 && (
            <div className="space-y-2 mb-3">
              {book.keyLessons!.map((l, i) => (
                <div key={i} className="bg-surface-2/30 rounded-lg p-3 text-sm text-text-secondary flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  {l}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newLesson}
              onChange={(e) => setNewLesson(e.target.value)}
              placeholder="Új tanulság..."
              className="bg-surface-0/50 border-white/10 text-text-primary text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') addLesson(); }}
            />
            <Button size="sm" onClick={addLesson} disabled={!newLesson.trim()} className="bg-primary/20 text-primary hover:bg-primary/30">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Reading history */}
        {sortedLogs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4" /> Olvasási napló
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-surface-2/30 rounded-lg p-2 px-3 text-sm">
                  <span className="text-text-muted">{new Date(log.date + 'T00:00:00').toLocaleDateString('hu-HU')}</span>
                  <div className="text-right">
                    <span className="text-text-primary font-medium">{log.pagesRead} oldal</span>
                    {log.note && <p className="text-xs text-text-muted">{log.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============ BOOK DIALOG (add/edit) ============

function BookDialog({ open, onOpenChange, book, onSaved }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  book: Book | null;
  onSaved?: (b: Partial<Book> & { id?: string }) => void;
}) {
  const { addBook, updateBook } = useAppStore();
  const [form, setForm] = useState({
    title: '', author: '', totalPages: '', currentPage: '0',
    genre: 'Önfejlesztés', coverColor: COVER_COLORS[0], status: 'want-to-read' as Book['status'],
  });

  // Reset form when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o && book) {
      setForm({
        title: book.title, author: book.author,
        totalPages: String(book.totalPages), currentPage: String(book.currentPage),
        genre: book.genre, coverColor: book.coverColor, status: book.status,
      });
    } else if (o && !book) {
      setForm({
        title: '', author: '', totalPages: '', currentPage: '0',
        genre: 'Önfejlesztés', coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
        status: 'want-to-read',
      });
    }
    onOpenChange(o);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || !form.totalPages) return;

    const data = {
      title: form.title.trim(),
      author: form.author.trim(),
      totalPages: Number(form.totalPages),
      currentPage: Number(form.currentPage) || 0,
      genre: form.genre,
      coverColor: form.coverColor,
      status: form.status,
    };

    if (book) {
      await updateBook(book.id, data);
      onSaved?.({ id: book.id, ...data });
      toast.success('Könyv frissítve!');
    } else {
      await addBook(data);
      toast.success('Könyv hozzáadva!');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{book ? 'Könyv szerkesztése' : 'Új könyv'}</DialogTitle>
          <DialogDescription className="text-text-secondary">{book ? 'Módosítsd a könyv adatait.' : 'Add hozzá a könyvet a polcodhoz.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Pl. Atomic Habits" className="bg-surface-0/50 border-white/10" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Szerző</Label>
            <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="Pl. James Clear" className="bg-surface-0/50 border-white/10" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Összes oldal</Label>
              <Input type="number" value={form.totalPages} onChange={(e) => setForm((f) => ({ ...f, totalPages: e.target.value }))} placeholder="320" className="bg-surface-0/50 border-white/10" required min={1} />
            </div>
            <div className="space-y-2">
              <Label>Jelenlegi oldal</Label>
              <Input type="number" value={form.currentPage} onChange={(e) => setForm((f) => ({ ...f, currentPage: e.target.value }))} className="bg-surface-0/50 border-white/10" min={0} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Műfaj</Label>
              <Select value={form.genre} onValueChange={(v) => setForm((f) => ({ ...f, genre: v }))}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Státusz</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Book['status'] }))}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="want-to-read">Olvasnám</SelectItem>
                  <SelectItem value="reading">Olvasom</SelectItem>
                  <SelectItem value="completed">Kész</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Color picker */}
          <div className="space-y-2">
            <Label>Borító szín</Label>
            <div className="flex flex-wrap gap-2">
              {COVER_COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setForm((f) => ({ ...f, coverColor: c }))}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    form.coverColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-1 scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Mégse</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">{book ? 'Mentés' : 'Hozzáadás'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ LOG READING DIALOG ============

function LogReadingDialog({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const { logReading } = useAppStore();
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');

  if (!book) return null;

  const remaining = book.totalPages - book.currentPage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(pages);
    if (p <= 0) return;
    await logReading(book.id, p, note.trim() || undefined);
    toast.success(`${p} oldal naplózva!`);
    setPages('');
    setNote('');
    onClose();
  };

  return (
    <Dialog open={!!book} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Olvasás naplózása</DialogTitle>
          <DialogDescription className="text-text-secondary">
            {book.title} — {book.currentPage}/{book.totalPages} oldal ({remaining} hátra)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Olvasott oldalak</Label>
            <Input
              type="number" value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder={`Max ${remaining}`}
              className="bg-surface-0/50 border-white/10"
              required min={1} max={remaining} autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Megjegyzés (opcionális)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Gondolatok, jegyzet..."
              className="bg-surface-0/50 border-white/10"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Mégse</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0" disabled={!pages || Number(pages) <= 0}>
              Naplózás
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
