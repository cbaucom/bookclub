import { useRatings } from './useRatings';

export function useBookRating(bookId: string, groupId: string) {
	const { rate } = useRatings(bookId, groupId);
	return (rating: number, review?: string) => rate({ rating, review });
}