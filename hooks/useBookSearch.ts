import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import type { Book } from '@prisma/client';

async function searchBooks(query: string): Promise<Book[]> {
	if (!query) return [];
	const response = await fetch(`${BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`);
	if (!response.ok) {
		throw new Error('Failed to search books');
	}
	return response.json();
}

export function useBookSearch(query: string) {
	return useQuery<Book[], Error>({
		queryKey: ['books', 'search', query],
		queryFn: () => searchBooks(query),
		enabled: Boolean(query),
		gcTime: 0, // Don't keep the cache
		refetchOnMount: true, // Always refetch when component mounts
	});
}