export interface SessionUser {
	email: string;
	name: string;
	picture: string;
	accessToken?: string;
}

export interface UserResponse {
	name: string;
	updated_at: string;
	slots: Record<string, number[]>;
}

export interface Creneau {
	id: string;
	title: string;
	created_by: string;
	created_at: string;
	date_start: string;
	date_end: string;
	hour_start: number;
	hour_end: number;
	include_weekends: boolean;
	responses: Record<string, UserResponse>;
}

export interface CalendarEvent {
	id: string;
	summary: string;
	start: string; // ISO datetime
	end: string; // ISO datetime
}

export interface AppConfig {
	allowed_emails: string[];
}

export interface BestSlot {
	date: string;
	hour: number;
	count: number;
	total: number;
	ratio: number;
}
