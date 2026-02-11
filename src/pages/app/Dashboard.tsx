import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, BookOpen, Calendar as CalendarIcon, Zap, Check, Circle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { getLocalDateString } from '@/lib/dateUtils';

export default function Dashboard() {
  const { currentPersona } = usePersonaStore();
  const { userStats, quests, lists, events, completeQuest, updateTask } = useAppStore();
  const navigate = useNavigate();

  const today = getLocalDateString();
  const todayQuests = quests.filter(q => !q.completed).slice(0, 3);
  const completedToday = quests.filter(q => q.completed && q.completedAt?.startsWith(today)).length;

  // Upcoming events (from now onwards, sorted by start time, max 4)
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.startTime) >= new Date(now.getTime() - 30 * 60 * 1000)) // include events started up to 30 min ago
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  const formatEventTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

  const formatEventDate = (dateString: string) => {
    const eventDate = new Date(dateString);
    const todayDate = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (eventDate.toDateString() === todayDate.toDateString()) return 'Ma';
    if (eventDate.toDateString() === tomorrow.toDateString()) return 'Holnap';
    return eventDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  const isEventSoon = (startTime: string) => {
    const diff = new Date(startTime).getTime() - now.getTime();
    return diff > 0 && diff < 60 * 60 * 1000; // within 1 hour
  };

  // Lists with incomplete tasks for dashboard
  const listsWithTasks = lists
    .map((list) => ({
      ...list,
      incompleteTasks: list.tasks.filter((t) => !t.completed),
      completedCount: list.tasks.filter((t) => t.completed).length,
    }))
    .filter((list) => list.tasks.length > 0);

  const toggleDashboardTask = async (listId: string, taskId: string, completed: boolean) => {
    await updateTask(listId, taskId, { completed: !completed });
  };

  const getPersonaModuleContent = (module: string) => {
    switch (module) {
      case 'schedule':
        return { title: 'Mai órák', icon: Clock, content: 'Naptár megtekintése', action: 'Órarend megtekintése', link: '/app/calendar' };
      case 'exams':
        return { title: 'Következő vizsgák', icon: Target, content: 'Küldetések megtekintése', action: 'Felkészülés tervezése', link: '/app/quests' };
      case 'daily-focus':
        return { title: 'Napi fókusz', icon: Target, content: 'Listák megtekintése', action: 'Fókusz beállítása', link: '/app/lists' };
      case 'meetings':
        return { title: 'Következő meeting', icon: CalendarIcon, content: 'Naptár megtekintése', action: 'Meeting előkészítése', link: '/app/calendar' };
      case 'habits':
        return { title: 'Szokás tracker', icon: Target, content: 'Küldetések megtekintése', action: 'Mai szokások', link: '/app/quests' };
      case 'daily-challenge':
        return { title: 'Napi kihívás', icon: Zap, content: 'Küldetések megtekintése', action: 'Kihívás teljesítése', link: '/app/quests' };
      case 'clients':
        return { title: 'Aktív ügyfelek', icon: Target, content: 'Listák megtekintése', action: 'Ügyfél portál', link: '/app/lists' };
      case 'deadlines':
        return { title: 'Közeli határidők', icon: Clock, content: 'Naptár megtekintése', action: 'Határidők rendezése', link: '/app/calendar' };
      case 'household':
        return { title: 'Háztartási feladatok', icon: Target, content: 'Listák megtekintése', action: 'Feladatok megtekintése', link: '/app/lists' };
      case 'finances':
        return { title: 'Pénzügyi áttekintő', icon: Target, content: 'Listák megtekintése', action: 'Költségek megtekintése', link: '/app/lists' };
      default:
        return { title: 'Gyors jegyzet', icon: BookOpen, content: 'Jegyzetek megtekintése', action: 'Jegyzet írása', link: '/app/notes' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-2">
          {currentPersona.heroTitle}
        </h1>
        <p className="text-lg text-text-secondary">
          {currentPersona.heroSubtitle}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: userStats.level, label: 'Szint', color: 'text-primary', delay: 0.1 },
          { value: userStats.streak, label: 'Napos sorozat', color: 'text-secondary', delay: 0.2 },
          { value: completedToday, label: 'Ma teljesítve', color: 'text-success', delay: 0.3 },
          { value: userStats.essence, label: 'Essence', color: 'text-warning', delay: 0.4 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: stat.delay }}
          >
            <Card className="glass p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Quests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Mai küldetések
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate('/app/quests')}
            >
              Összes küldetés
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {todayQuests.length > 0 ? (
              todayQuests.map((quest, index) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface-1/50 hover:bg-surface-1/70 transition-colors"
                >
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="w-2 h-2 rounded-full bg-primary hover:ring-2 hover:ring-primary/50 transition-all mt-2 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary text-sm sm:text-base">{quest.title}</h3>
                    <p className="text-xs sm:text-sm text-text-muted line-clamp-2">{quest.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 sm:hidden">
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />{quest.estimatedTime}p
                      </div>
                      <div className="text-xs text-primary font-medium">+{quest.xpReward} XP</div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-text-muted flex-shrink-0">
                    <Clock className="h-4 w-4" />
                    {quest.estimatedTime}p
                  </div>
                  <div className="hidden sm:block text-sm text-primary font-medium flex-shrink-0">
                    +{quest.xpReward} XP
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Zap className="h-12 w-12 mx-auto mb-3 text-text-disabled" />
                <p>Nincsenek mai küldetések</p>
                <p className="text-sm">Hozz létre egyet a kezdéshez!</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Daily Tasks by List */}
      {listsWithTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Feladatok
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate('/app/lists')}
              >
                Összes lista
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-5">
              {listsWithTasks.map((list) => (
                <div key={list.id}>
                  {/* List header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: list.color }}
                    />
                    <h3 className="font-medium text-text-primary text-sm">{list.name}</h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-white/15 text-text-muted ml-auto"
                    >
                      {list.completedCount}/{list.tasks.length}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  {list.tasks.length > 0 && (
                    <div className="w-full bg-surface-2 rounded-full h-1.5 mb-3">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: list.color,
                          width: `${(list.completedCount / list.tasks.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Tasks */}
                  <div className="space-y-1.5">
                    {list.incompleteTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-1/30 hover:bg-surface-1/50 transition-colors group"
                      >
                        <button
                          onClick={() => toggleDashboardTask(list.id, task.id, task.completed)}
                          className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Circle className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-text-primary flex-1 truncate">
                          {task.title}
                        </span>
                        <Badge
                          className={cn(
                            'text-xs',
                            task.priority === 'low' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                            task.priority === 'medium' && 'bg-warning/20 text-warning border-warning/30',
                            task.priority === 'high' && 'bg-danger/20 text-danger border-danger/30',
                          )}
                        >
                          {task.priority === 'low' ? 'A' : task.priority === 'medium' ? 'K' : 'M'}
                        </Badge>
                      </div>
                    ))}
                    {list.incompleteTasks.length > 4 && (
                      <button
                        onClick={() => navigate('/app/lists')}
                        className="text-xs text-text-muted hover:text-primary transition-colors pl-10"
                      >
                        +{list.incompleteTasks.length - 4} további feladat...
                      </button>
                    )}
                    {list.incompleteTasks.length === 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-success">
                        <Check className="h-4 w-4" />
                        Minden feladat kész!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Közelgő események
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate('/app/calendar')}
              >
                Naptár
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-2">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                    isEventSoon(event.startTime)
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-surface-1/50 hover:bg-surface-1/70"
                  )}
                  onClick={() => navigate('/app/calendar')}
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text-primary text-sm sm:text-base truncate">
                        {event.title}
                      </h3>
                      {isEventSoon(event.startTime) && (
                        <Badge className="text-xs bg-primary/20 text-primary border-primary/30 flex-shrink-0">
                          Hamarosan
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-muted truncate">{event.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="text-xs font-medium text-text-secondary">
                      {formatEventDate(event.startTime)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Persona-specific modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPersona.dashboardModules.slice(0, 6).map((module, index) => {
          const moduleContent = getPersonaModuleContent(module);

          return (
            <motion.div
              key={module}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <Card className="glass p-4 hover-lift cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <moduleContent.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-text-primary">{moduleContent.title}</h3>
                </div>
                <p className="text-text-secondary mb-3">{moduleContent.content}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-primary hover:bg-primary/10"
                  onClick={() => navigate(moduleContent.link)}
                >
                  {moduleContent.action}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Szint előrehaladás
            </h2>
            <div className="text-sm text-text-muted">
              {userStats.xp} / {userStats.xpToNextLevel} XP
            </div>
          </div>

          <Progress
            value={(userStats.xp / userStats.xpToNextLevel) * 100}
            className="h-3 bg-surface-2"
          />

          <div className="flex justify-between mt-2 text-sm text-text-muted">
            <span>Szint {userStats.level}</span>
            <span>Szint {userStats.level + 1}</span>
          </div>
        </Card>
      </motion.div>

    </div>
  );
}
