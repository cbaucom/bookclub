import { useQuery } from '@tanstack/react-query';
import { BookWithRatings } from '@/types';

async function getBook(bookId: string, groupId: string): Promise<BookWithRatings> {
	const response = await fetch(`/api/groups/${groupId}/books/${bookId}`);
	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Failed to fetch book');
	}
	return response.json();
}

export function useBook(bookId: string, groupId: string) {
	return useQuery({
		queryKey: ['book', bookId, groupId],
		queryFn: () => getBook(bookId, groupId),
		retry: false,
	});
}