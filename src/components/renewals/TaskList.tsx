/**
 * TaskList Component
 * Checklist UI for renewal workflow tasks
 */

import { useState, useEffect } from 'react';
import { Check, Circle, Clock, AlertTriangle, Plus, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, Task } from '@/services/api';
import { toast } from 'sonner';

interface TaskListProps {
  renewalId: string;
  onTaskUpdate?: () => void;
}

const priorityConfig = {
  LOW: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Low' },
  MEDIUM: { color: 'text-blue-500', bg: 'bg-blue-100', label: 'Medium' },
  HIGH: { color: 'text-orange-500', bg: 'bg-orange-100', label: 'High' },
  URGENT: { color: 'text-red-500', bg: 'bg-red-100', label: 'Urgent' },
};

const statusConfig = {
  PENDING: { icon: Circle, color: 'text-slate-400', label: 'Pending' },
  IN_PROGRESS: { icon: Clock, color: 'text-blue-500', label: 'In Progress' },
  COMPLETED: { icon: Check, color: 'text-green-500', label: 'Completed' },
  OVERDUE: { icon: AlertTriangle, color: 'text-red-500', label: 'Overdue' },
  SKIPPED: { icon: Circle, color: 'text-slate-300', label: 'Skipped' },
};

const categoryLabels: Record<string, string> = {
  DATA_COLLECTION: 'Data Collection',
  MARKETING: 'Marketing',
  QUOTE_FOLLOW_UP: 'Quote Follow-up',
  CLIENT_COMMUNICATION: 'Client Communication',
  PROPOSAL: 'Proposal',
  BINDING: 'Binding',
  POST_BIND: 'Post-Bind',
  OTHER: 'Other',
};

export function TaskList({ renewalId, onTaskUpdate }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, overdue: 0, percentComplete: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['DATA_COLLECTION', 'MARKETING', 'QUOTE_FOLLOW_UP']));
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [renewalId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.getRenewalTasks(renewalId);
      if (response.data) {
        setTasks(response.data.tasks);
        setProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      await fetchTasks();
      onTaskUpdate?.();
      toast.success(newStatus === 'COMPLETED' ? 'Task completed!' : 'Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim()) return;

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      await api.createTask({
        renewalId,
        name: newTaskName,
        dueDate: dueDate.toISOString(),
        priority: 'MEDIUM',
      });

      setNewTaskName('');
      setShowAddTask(false);
      await fetchTasks();
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const category = task.category || 'OTHER';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-secondary rounded w-1/3"></div>
          <div className="h-2 bg-secondary rounded w-full"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with Progress */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Workflow Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {progress.completed} of {progress.total} completed
              {progress.overdue > 0 && (
                <span className="text-red-500 ml-2">• {progress.overdue} overdue</span>
              )}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
        <Progress value={progress.percentComplete} className="h-2" />
      </div>

      {/* Add Task Input */}
      {showAddTask && (
        <div className="p-4 border-b bg-accent/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Enter task name..."
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              autoFocus
            />
            <Button size="sm" onClick={handleAddTask}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Task List by Category */}
      <div className="divide-y">
        {Object.entries(categoryLabels).map(([category, label]) => {
          const categoryTasks = tasksByCategory[category] || [];
          if (categoryTasks.length === 0) return null;

          const isExpanded = expandedCategories.has(category);
          const completedInCategory = categoryTasks.filter(t => t.status === 'COMPLETED').length;

          return (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">{label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {completedInCategory}/{categoryTasks.length}
                  </Badge>
                </div>
              </button>

              {/* Tasks in Category */}
              {isExpanded && (
                <div className="bg-muted/20">
                  {categoryTasks.map((task) => {
                    const status = statusConfig[task.status];
                    const priority = priorityConfig[task.priority];
                    const StatusIcon = status.icon;
                    const isCompleted = task.status === 'COMPLETED';
                    const isOverdue = task.status === 'OVERDUE';

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'px-4 py-3 flex items-center gap-3 border-l-2 ml-4 hover:bg-muted/50 transition-colors',
                          isCompleted && 'border-l-green-500 opacity-60',
                          isOverdue && 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
                          !isCompleted && !isOverdue && 'border-l-transparent'
                        )}
                      >
                        {/* Status Toggle */}
                        <button
                          onClick={() => handleStatusChange(
                            task.id,
                            isCompleted ? 'PENDING' : 'COMPLETED'
                          )}
                          className={cn(
                            'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : isOverdue
                              ? 'border-red-400 hover:border-red-500'
                              : 'border-slate-300 hover:border-primary'
                          )}
                        >
                          {isCompleted && <Check className="h-3 w-3" />}
                        </button>

                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            isCompleted && 'line-through text-muted-foreground'
                          )}>
                            {task.name}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Due Date */}
                        <span className={cn(
                          'text-xs whitespace-nowrap',
                          isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
                        )}>
                          {formatDueDate(task.dueDate)}
                        </span>

                        {/* Priority Badge */}
                        {task.priority !== 'MEDIUM' && (
                          <Badge variant="outline" className={cn('text-xs', priority.color)}>
                            {priority.label}
                          </Badge>
                        )}

                        {/* Status for non-completed */}
                        {!isCompleted && task.status === 'IN_PROGRESS' && (
                          <Badge variant="outline" className="text-xs text-blue-500">
                            In Progress
                          </Badge>
                        )}

                        {/* Actions */}
                        <button
                          className="p-1 rounded hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Could open a dropdown menu here
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Circle className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No tasks yet</p>
          <p className="text-sm">Tasks will be created when the renewal workflow starts</p>
        </div>
      )}
    </Card>
  );
}

export default TaskList;
