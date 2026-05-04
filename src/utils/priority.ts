import type { Priority } from '../types';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; ring: string }> = {
  p1: { label: 'P1', color: 'text-red-600',    bg: 'bg-red-50',    ring: 'ring-red-400' },
  p2: { label: 'P2', color: 'text-orange-500', bg: 'bg-orange-50', ring: 'ring-orange-400' },
  p3: { label: 'P3', color: 'text-blue-500',   bg: 'bg-blue-50',   ring: 'ring-blue-400' },
  p4: { label: 'P4', color: 'text-gray-400',   bg: 'bg-gray-50',   ring: 'ring-gray-300' },
};

export const PROJECT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500' },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-500' },
};
