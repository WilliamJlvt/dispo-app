import type { CalendarEvent } from './types';

const FR_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_MONTHS = [
	'jan',
	'fév',
	'mar',
	'avr',
	'mai',
	'jun',
	'jul',
	'aoû',
	'sep',
	'oct',
	'nov',
	'déc'
];

/**
 * Returns an array of date strings (YYYY-MM-DD) between start and end (inclusive).
 * Excludes weekends unless include_weekends is true.
 */
export function getDatesInRange(
	dateStart: string,
	dateEnd: string,
	includeWeekends = false
): string[] {
	const dates: string[] = [];
	const start = new Date(dateStart + 'T00:00:00');
	const end = new Date(dateEnd + 'T00:00:00');

	const current = new Date(start);
	while (current <= end) {
		const day = current.getDay(); // 0 = Sun, 6 = Sat
		if (includeWeekends || (day !== 0 && day !== 6)) {
			// Use local date parts to avoid UTC offset shifting the date
			const y = current.getFullYear();
			const m = String(current.getMonth() + 1).padStart(2, '0');
			const d = String(current.getDate()).padStart(2, '0');
			dates.push(`${y}-${m}-${d}`);
		}
		current.setDate(current.getDate() + 1);
	}
	return dates;
}

/**
 * Returns array of hours from hourStart up to (but not including) hourEnd.
 * e.g. getHours(10, 13) => [10, 11, 12]
 */
export function getHours(hourStart: number, hourEnd: number): number[] {
	const hours: number[] = [];
	for (let h = hourStart; h < hourEnd; h++) {
		hours.push(h);
	}
	return hours;
}

/**
 * Returns a CSS color string for a given convergence ratio (0–1).
 * 0       => off-white
 * 0–0.5   => off-white → green-400 (#4ade80)
 * 0.5–1   => green-400 → green-800 (#166534)
 */
export function heatmapColor(ratio: number): string {
	if (ratio === 0) return '#f9fafb';

	if (ratio <= 0.5) {
		const t = ratio * 2;
		// #f0fdf4 (green-50) → #4ade80 (green-400)
		const r = Math.round(240 + t * (74 - 240));
		const g = Math.round(253 + t * (222 - 253));
		const b = Math.round(244 + t * (128 - 244));
		return `rgb(${r},${g},${b})`;
	} else {
		const t = (ratio - 0.5) * 2;
		// #4ade80 (green-400) → #166534 (green-800)
		const r = Math.round(74 + t * (22 - 74));
		const g = Math.round(222 + t * (101 - 222));
		const b = Math.round(128 + t * (52 - 128));
		return `rgb(${r},${g},${b})`;
	}
}

/**
 * Converts a Date object to a local ISO datetime string "YYYY-MM-DDTHH:MM:SS"
 * without any timezone suffix, using the browser/server's local timezone.
 * This avoids UTC-based comparisons that can shift events to the wrong day.
 */
function toLocalDateTimeStr(d: Date): string {
	const y = d.getFullYear();
	const mo = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const h = String(d.getHours()).padStart(2, '0');
	const mi = String(d.getMinutes()).padStart(2, '0');
	const s = String(d.getSeconds()).padStart(2, '0');
	return `${y}-${mo}-${day}T${h}:${mi}:${s}`;
}

/**
 * Checks if a Google Calendar event overlaps a given date+hour slot.
 * The slot is from hour:00 to hour+1:00 on the given date.
 * Comparison is done in LOCAL time to avoid UTC offset shifting events to the wrong day.
 */
export function eventOverlapsSlot(event: CalendarEvent, date: string, hour: number): boolean {
	const slotStart = `${date}T${String(hour).padStart(2, '0')}:00:00`;
	const slotEnd = `${date}T${String(hour + 1).padStart(2, '0')}:00:00`;
	// Convert event times to local datetime strings (handles timezone offsets in event.start)
	const evStart = toLocalDateTimeStr(new Date(event.start));
	const evEnd = toLocalDateTimeStr(new Date(event.end));
	// String comparison works because ISO datetime strings are lexicographically sortable
	return evStart < slotEnd && evEnd > slotStart;
}

/**
 * Formats a YYYY-MM-DD date string as "Lun 8 jan"
 */
export function formatDate(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00');
	const dayName = FR_DAYS[d.getDay()];
	const dayNum = d.getDate();
	const month = FR_MONTHS[d.getMonth()];
	return `${dayName} ${dayNum} ${month}`;
}

/**
 * Returns separate parts for a rich date header.
 */
export function formatDateParts(dateStr: string): { day: string; num: number; month: string } {
	const d = new Date(dateStr + 'T00:00:00');
	return {
		day: FR_DAYS[d.getDay()],
		num: d.getDate(),
		month: FR_MONTHS[d.getMonth()]
	};
}

/**
 * Formats an hour number as "10h", "14h", etc.
 */
export function formatHour(hour: number): string {
	return `${hour}h`;
}

/**
 * Generates a URL-friendly slug from a title + random suffix.
 * e.g. "Réunion Team" => "reunion-team-x4z2"
 */
export function generateSlug(title: string): string {
	const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	const base = title
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // remove accents
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.slice(0, 40);
	const rand = Math.random().toString(36).slice(2, 6);
	return `${date}-${base}-${rand}`;
}

/**
 * Returns the next Monday from today (or today if it's Monday).
 */
export function nextMonday(): string {
	const d = new Date();
	const day = d.getDay();
	const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
	d.setDate(d.getDate() + diff);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${dd}`;
}

/**
 * Returns the next Friday from today (or today if it's Friday).
 * Used together with nextMonday for form defaults.
 */
export function nextFriday(): string {
	const monday = new Date(nextMonday() + 'T00:00:00');
	monday.setDate(monday.getDate() + 4);
	const y = monday.getFullYear();
	const m = String(monday.getMonth() + 1).padStart(2, '0');
	const d = String(monday.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
