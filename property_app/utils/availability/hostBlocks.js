import { addDays, isDateInRange } from "@/utils/availability/calendarGrid";
import { parseDateOnly } from "@/utils/availability/dateUtils";

/**
 * Remove one day from host blocks, splitting ranges when needed.
 * @param {Array<{ startDate: string, endDate: string, note?: string }>} hostBlocks
 * @param {string} dateStr YYYY-MM-DD
 */
export function unlockDayFromHostBlocks(hostBlocks, dateStr) {
  const result = [];

  for (const block of hostBlocks) {
    if (!isDateInRange(dateStr, block.startDate, block.endDate)) {
      result.push(block);
      continue;
    }

    const start = parseDateOnly(block.startDate);
    const end = parseDateOnly(block.endDate);
    const day = parseDateOnly(dateStr);
    if (start == null || end == null || day == null) continue;

    if (block.startDate < dateStr) {
      result.push({
        startDate: block.startDate,
        endDate: dateStr,
        note: block.note,
      });
    }

    const dayAfter = addDays(dateStr, 1);
    if (parseDateOnly(dayAfter) < end) {
      result.push({
        startDate: dayAfter,
        endDate: block.endDate,
        note: block.note,
      });
    }
  }

  return result;
}

/** Remove entire block at index. */
export function removeHostBlockAt(hostBlocks, index) {
  return hostBlocks.filter((_, i) => i !== index);
}

export function formatBlockLabel(block) {
  const lastNight = addDays(block.endDate, -1);
  if (block.startDate === lastNight) {
    return block.startDate;
  }
  return `${block.startDate} → ${lastNight}`;
}
