export type CategoryName = 'Deep Work' | 'Study' | 'Breaks' | 'Routine' | 'Meeting';

export interface Category {
  name: CategoryName;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  category: CategoryName;
  startHour: number; // e.g., 8.5 for 8:30 AM
  durationHours: number; // e.g., 1.5 for 1 hour 30 mins
}

export interface RoutineTemplate {
  id: string;
  name: string;
  blocks: TimeBlock[];
}
