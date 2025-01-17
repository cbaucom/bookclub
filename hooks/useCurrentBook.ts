import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import { useAuth } from '@clerk/nextjs';
import { Book, Note, User } from '@prisma/client';

interface NoteWithUser extends Note {
	user: User;
}

interface BookWithRelations extends Book {
	notes: NoteWithUser[];
	averageRating?: number | null;
	totalRatings?: number;
	userRating?: number | null;
}

async function fetchCurrentBook(groupId: string): Promise<BookWithRelations | null> {
	const response = await fetch(`${BASE_URL}/api/groups/${groupId}/current-book`);
	if (!response.ok) {
		throw new Error('Failed to fetch current book');
	}
	return response.json();
}

export function useCurrentBook(groupId: string) {
	const { isLoaded, isSignedIn } = useAuth();

	return useQuery({
		queryKey: ['currentBook', groupId, isSignedIn],
		queryFn: () => fetchCurrentBook(groupId),
		enabled: isLoaded && isSignedIn,
	});
}
