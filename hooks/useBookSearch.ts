import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';

interface Book {
	id: string;
	title: string;
	author: string;
	description?: string;
	imageUrl?: string;
	amazonUrl?: string;
}

async function searchBooks(query: string): Promise<Book[]> {
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
	});
}