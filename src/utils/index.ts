import { format } from "../deps.ts";

const MS_IN_DAY = 86400000;

export function getDayNumber(currentDate: Date, startDate: Date): number {
  const msBetweenDates = currentDate.getTime() - startDate.getTime();
  return Math.floor(msBetweenDates / MS_IN_DAY);
}

export function getWeekNumber(currentDate: Date, startDate: Date) {
  return Math.floor(getDayNumber(currentDate, startDate) / 7) + 1;
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }
  const dates: Date[] = [];
  const currentDate = startDate;
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function getDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}
