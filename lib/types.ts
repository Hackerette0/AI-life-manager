export type EnergyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done";
export type EnergyRequired = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  description?: string;
  energyRequired: EnergyRequired;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedMinutes: number;
  deadline?: string;
  tags: string[];
  createdAt: string;
  timeSpentMinutes?: number;
}

export interface DayContext {
  energyLevel: EnergyLevel;
  mood: string;
  sleepHours: number;
  notes: string;
  checkedInAt: string;
}

export interface ScheduledBlock {
  time: string;
  title: string;
  duration: number;
  type: "task" | "break" | "meal" | "exercise" | "rest" | "focus" | "habit";
  taskId?: string;
  habitId?: string;
  notes?: string;
}

export interface DayPlan {
  generatedAt: string;
  schedule: ScheduledBlock[];
  summary: string;
  tips: string[];
  focusTimeMinutes?: number;
  deepWorkIndex?: number;
}

export interface WellnessReminder {
  id: string;
  type: "eat" | "move" | "rest" | "water" | "breathe";
  label: string;
  icon: string;
  intervalMinutes: number;
  lastTriggered?: string;
  enabled: boolean;
}

// ── Habits ───────────────────────────────────────────────────────────────────

export type HabitFrequency = "daily" | "weekdays" | "weekends" | "weekly";
export type HabitCategory = "health" | "work" | "learning" | "mindfulness" | "social";

export interface HabitLog {
  date: string;
  completed: boolean;
  minutesSpent?: number;
  note?: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetMinutes: number;
  category: HabitCategory;
  energyRequired: EnergyRequired;
  logs: HabitLog[];
  createdAt: string;
}

// ── Focus Sessions ───────────────────────────────────────────────────────────

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  plannedMinutes: number;
  startedAt: string;
  completedAt?: string;
  interrupted: boolean;
  actualMinutes?: number;
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  color?: string;
  description?: string;
  location?: string;
  source: "google" | "manual";
  priority?: TaskPriority;
}

export interface CalendarReminder {
  id: string;
  title: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  notes?: string;
  createdAt: string;
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  priority: TaskPriority;
  color: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationType =
  | "google_calendar"
  | "notion"
  | "github"
  | "excel"
  | "linkedin";

export interface Integration {
  id: IntegrationType;
  connected: boolean;
  config: Record<string, string>;
  lastSynced?: string;
  importedCount?: number;
}

// ── App State ─────────────────────────────────────────────────────────────────

export interface AppState {
  dayContext: DayContext | null;
  tasks: Task[];
  dayPlan: DayPlan | null;
  reminders: WellnessReminder[];
  habits: Habit[];
  focusSessions: FocusSession[];
  calendarEvents: CalendarEvent[];
  calendarReminders: CalendarReminder[];
  notes: Note[];
  integrations: Integration[];
  lastUpdated: string;
}
