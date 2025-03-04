import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import type { SearchBook } from '@/types';
import { useEffect, useState } from 'react';

// Add a debug logger that only runs in production
const logDebug = (message: string, data?: unknown) => {
	if (process.env.NODE_ENV === 'production') {
		console.log(`[BookSearch Debug] ${message}`, data || '');
	}
};

async function searchBooks(query: string): Promise<SearchBook[]> {
	if (!query) return [];
	logDebug(`Fetching books for query: ${query}`);
	const response = await fetch(`${BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`);
	if (!response.ok) {
		throw new Error('Failed to search books');
	}
	const data = await response.json();
	logDebug(`Received ${data.length} results for query: ${query}`);
	return data;
}

export function useBookSearch(query: string) {
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const queryClient = useQueryClient();

	// Debounce the search query to prevent excessive API calls
	useEffect(() => {
		logDebug(`Query changed to: ${query}`);
		const timer = setTimeout(() => {
			logDebug(`Setting debounced query to: ${query}`);
			setDebouncedQuery(query);
		}, 300);

		return () => clearTimeout(timer);
	}, [query]);

	// Only invalidate the specific query when it changes
	useEffect(() => {
		// Don't remove queries, just invalidate the current one to trigger a refetch
		if (debouncedQuery) {
			logDebug(`Invalidating query for: ${debouncedQuery}`);
			queryClient.invalidateQueries({
				queryKey: ['books', 'search', debouncedQuery]
			});
		}
	}, [debouncedQuery, queryClient]);

	return useQuery<SearchBook[], Error>({
		queryKey: ['books', 'search', debouncedQuery],
		queryFn: () => searchBooks(debouncedQuery),
		enabled: Boolean(debouncedQuery)
	});
}