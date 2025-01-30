import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import { BookWithRatings, BookWithDetails } from '@/types';

async function fetchBooks(groupId: string, status: string): Promise<BookWithRatings[]> {
	const response = await fetch(`${BASE_URL}/api/groups/${groupId}/books?status=${status}`);
	if (!response.ok) {
		throw new Error('Failed to fetch books');
	}
	return response.json();
}

async function getCurrentBook(groupId: string): Promise<BookWithDetails | null> {
	const response = await fetch(`${BASE_URL}/api/groups/${groupId}/current-book`);

	if (!response.ok) {
		throw new Error('Failed to fetch current book');
	}

	const result = await response.json();
	return result;
}

export function useBooks(groupId: string, status: 'CURRENT' | 'PREVIOUS' | 'UPCOMING') {
	return useQuery({
		queryKey: ['books', groupId, status],
		queryFn: () => fetchBooks(groupId, status),
	});
}

export function useCurrentBook(groupId: string) {
	return useQuery<BookWithDetails | null>({
		queryKey: ['currentBook', groupId],
		queryFn: () => getCurrentBook(groupId),
		enabled: !!groupId,
	});
}