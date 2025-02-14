import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import type { SearchBook } from '@/types';
import { useEffect } from 'react';

async function searchBooks(query: string): Promise<SearchBook[]> {
	if (!query) return [];
	const response = await fetch(`${BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`);
	if (!response.ok) {
		throw new Error('Failed to search books');
	}
	return response.json();
}

export function useBookSearch(query: string) {
	const queryClient = useQueryClient();

	// Clear previous search results when query changes
	useEffect(() => {
		queryClient.removeQueries({ queryKey: ['books', 'search'] });
	}, [query, queryClient]);

	return useQuery<SearchBook[], Error>({
		queryKey: ['books', 'search', query],
		queryFn: () => searchBooks(query),
		enabled: Boolean(query),
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
	});
}