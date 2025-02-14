import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import type { SearchBook } from '@/types';

async function searchBooks(query: string): Promise<SearchBook[]> {
	if (!query) return [];
	const response = await fetch(`${BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`);
	if (!response.ok) {
		throw new Error('Failed to search books');
	}
	return response.json();
}

export function useBookSearch(query: string) {
	return useQuery<SearchBook[], Error>({
		queryKey: ['books', 'search', query],
		queryFn: () => searchBooks(query),
		enabled: Boolean(query),
		gcTime: 0, // Don't keep the cache
		refetchOnMount: true, // Always refetch when component mounts
	});
}