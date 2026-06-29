import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge TailwindCSS classes with proper precedence */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
