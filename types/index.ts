import { Group, MemberRole, Book } from '@prisma/client';

export type { Book };

export type GroupWithRole = Group & {
	role: MemberRole;
};

export interface BookWithRatings extends Book {
	averageRating?: number | null;
	totalRatings?: number;
	userRating?: number | null;
}

interface GoogleBooksVolumeInfo {
	title: string;
	authors?: string[];
	description?: string;
	imageLinks?: {
		thumbnail?: string;
	};
}

interface GoogleBooksItem {
	id: string;
	volumeInfo: GoogleBooksVolumeInfo;
}

export interface GoogleBooksResponse {
	items: GoogleBooksItem[];
}