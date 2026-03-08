import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
} from "date-fns";

export const formatDate = (date: Date) => {
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";

  const dayDiff = differenceInCalendarDays(new Date(), date);

  if (dayDiff > 1 && dayDiff < 7)
    return formatDistanceToNowStrict(date, { unit: "day", addSuffix: true });

  return format(date, "MMM d, yyyy");
};
