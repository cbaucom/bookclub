import { Book, Note, Group, User } from '@prisma/client';

export interface GroupWithRole extends Group {
	role: string;
}

export interface NoteWithUser extends Note {
	user: User;
}

export interface BookWithRatings extends Omit<Book, 'startDate' | 'endDate'> {
	averageRating?: number | null;
	totalRatings?: number;
	userRating?: number | null;
	status?: string;
	startDate?: Date | null;
	endDate?: Date | null;
	notes?: NoteWithUser[];
}

export interface GoogleBooksResponse {
	items?: Array<{
		id: string;
		volumeInfo: {
			title: string;
			authors?: string[];
			description?: string;
			imageLinks?: {
				thumbnail?: string;
			};
		};
	}>;
}

export interface SearchBook {
	id: string;
	title: string;
	author: string;
	description?: string;
	imageUrl?: string;
	amazonUrl?: string;
}