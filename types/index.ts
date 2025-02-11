import { Book, Note, Group, User, Comment, Reaction, PollStatus, VotingMethod, Poll, PollOption as PrismaOption, Vote } from '@prisma/client';

export type UserInfo = Pick<User, 'firstName' | 'lastName' | 'clerkId' | 'imageUrl'>;

export interface ReactionWithUser extends Reaction {
	user: UserInfo;
}

export interface CommentWithUser extends Comment {
	user: UserInfo;
	reactions: ReactionWithUser[];
	replies?: CommentWithUser[];
}

export interface NoteWithUser extends Note {
	user: UserInfo;
	reactions: ReactionWithUser[];
	comments: CommentWithUser[];
}

export interface GroupWithRole extends Group {
	role: string;
	_count?: {
		members: number;
	};
	currentBook?: {
		id: string;
		title: string;
		author: string;
		imageUrl?: string | null;
	};
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

export interface BookWithDetails extends Book {
	notes: NoteWithUser[];
	averageRating?: number;
	totalRatings?: number;
	userRating?: number;
}

export interface GoogleBooksResponse {
	items?: Array<{
		id: string;
		volumeInfo: {
			title: string;
			subtitle?: string;
			authors?: string[];
			description?: string;
			imageLinks?: {
				smallThumbnail?: string;
				thumbnail?: string;
			};
			pageCount?: number;
			categories?: string[];
		};
		searchInfo?: {
			textSnippet?: string;
		};
	}>;
}

export interface SearchBook {
	id: string;
	title: string;
	subtitle?: string;
	author: string;
	description?: string;
	imageUrl?: string;
	amazonUrl?: string;
	pageCount?: number;
	categories?: string;
	textSnippet?: string;
}

export interface CreatePollRequest {
	title: string;
	description?: string;
	groupId: string;
	startDate?: string;
	endDate?: string;
	votingMethod: VotingMethod;
	maxPoints?: number;
	bookIds?: Array<string>;
	status?: PollStatus;
}

export interface UpdatePollRequest {
	title?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	status?: PollStatus;
}

export interface VoteRequest {
	pollOptionId: string;
	value: number;
}

export interface PollOption extends PrismaOption {
	book: Book;
	user: User;
	votes: Array<Vote & { user: User }>;
}

export interface PollWithOptions extends Poll {
	options: PollOption[];
}