import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import { BookWithRatings } from '@/types';
import { useAuth } from '@clerk/nextjs';

async function fetchBooks(groupId: string, status: string): Promise<BookWithRatings[]> {
	const response = await fetch(`${BASE_URL}/api/groups/${groupId}/books?status=${status}`);
	if (!response.ok) {
		throw new Error('Failed to fetch books');
	}
	return response.json();
}

async function fetchCurrentBook(groupId: string): Promise<BookWithRatings | null> {
	const response = await fetch(`${BASE_URL}/api/groups/${groupId}/current-book`);
	if (!response.ok) {
		throw new Error('Failed to fetch current book');
	}
	return response.json();
}

export function useBooks(groupId: string, status: 'CURRENT' | 'PREVIOUS' | 'UPCOMING') {
	return useQuery({
		queryKey: ['books', groupId, status],
		queryFn: () => fetchBooks(groupId, status),
	});
}

export function useCurrentBook(groupId: string) {
	const { isLoaded, isSignedIn } = useAuth();
	return useQuery({
		queryKey: ['currentBook', groupId, isSignedIn],
		queryFn: () => fetchCurrentBook(groupId),
		enabled: isLoaded && isSignedIn,
	});
}