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

	// Add a timestamp to prevent browser caching
	const timestamp = new Date().getTime();
	const response = await fetch(`${BASE_URL}/api/books/search?q=${encodeURIComponent(query)}&_t=${timestamp}`, {
		cache: 'no-store',
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		}
	});

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

	// Clear previous results when query changes
	useEffect(() => {
		if (debouncedQuery) {
			logDebug(`Clearing previous results for: ${debouncedQuery}`);
			// Force a refetch by invalidating
			queryClient.invalidateQueries({
				queryKey: ['books', 'search']
			});
		}
	}, [debouncedQuery, queryClient]);

	return useQuery<SearchBook[], Error>({
		queryKey: ['books', 'search', debouncedQuery],
		queryFn: () => searchBooks(debouncedQuery),
		enabled: Boolean(debouncedQuery),
		staleTime: 0, // Consider data stale immediately
		gcTime: 0, // Remove from cache immediately when unused
		refetchOnWindowFocus: true, // Refetch when window regains focus
		refetchOnMount: true, // Always refetch when component mounts
		refetchOnReconnect: true, // Refetch when reconnecting
		retry: 1, // Only retry once if there's an error
	});
}