import { Category } from './types';

export const CATEGORIES: Record<string, Category> = {
  'Deep Work': {
    name: 'Deep Work',
    colorClass: 'text-blue-300',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/50',
  },
  'Study': {
    name: 'Study',
    colorClass: 'text-purple-300',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/50',
  },
  'Breaks': {
    name: 'Breaks',
    colorClass: 'text-emerald-300',
    bgClass: 'bg-emerald-500/20',
    borderClass: 'border-emerald-500/50',
  },
  'Routine': {
    name: 'Routine',
    colorClass: 'text-slate-300',
    bgClass: 'bg-slate-500/20',
    borderClass: 'border-slate-500/50',
  },
  'Meeting': {
    name: 'Meeting',
    colorClass: 'text-orange-300',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-500/50',
  },
};

export const HOUR_HEIGHT = 120; // 120 pixels per hour
export const MINUTE_HEIGHT = HOUR_HEIGHT / 60; // 2 pixels per minute
