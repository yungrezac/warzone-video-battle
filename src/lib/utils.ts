
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number | null | undefined): string {
  if (points === null || points === undefined) return '0';
  // Используем 'de-DE' для получения точек в качестве разделителей тысяч
  return new Intl.NumberFormat('de-DE').format(points);
}
