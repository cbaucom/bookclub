import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';

interface RatingData {
	rating: number;
	review?: string;
}

interface Rating {
	id: string;
	rating: number;
	review?: string | null;
	user: {
		firstName: string | null;
		lastName: string | null;
	};
}

async function rateBook(bookId: string, data: RatingData): Promise<void> {
	const response = await fetch(`/api/books/${bookId}/ratings`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to rate book');
	}
}

async function fetchRatings(bookId: string): Promise<Rating[]> {
	const response = await fetch(`/api/books/${bookId}/ratings`);
	if (!response.ok) {
		throw new Error('Failed to fetch ratings');
	}
	return response.json();
}

export function useRatings(bookId: string, groupId: string) {
	const queryClient = useQueryClient();

	const { data: ratings } = useQuery({
		queryKey: ['ratings', bookId],
		queryFn: () => fetchRatings(bookId),
	});

	const { mutate: rate, isPending } = useMutation({
		mutationFn: (data: RatingData) => rateBook(bookId, data),
		onSuccess: () => {
			// Invalidate all book-related queries at once
			queryClient.invalidateQueries({
				queryKey: ['books', groupId],
				refetchType: 'all',
			});
			// Invalidate the current book query
			queryClient.invalidateQueries({
				queryKey: ['currentBook', groupId],
				refetchType: 'all',
			});
			// Invalidate the individual book query
			queryClient.invalidateQueries({
				queryKey: ['book', bookId, groupId],
				refetchType: 'all',
			});
			// Invalidate the specific rating that changed
			queryClient.invalidateQueries({
				queryKey: ['ratings', bookId],
				exact: true,
				refetchType: 'all',
			});
			toaster.create({
				title: 'Rating saved',
				type: 'success',
				duration: 3000,
			});
		},
		onError: (error: Error) => {
			toaster.create({
				title: 'Failed to save rating',
				description: error.message,
				type: 'error',
				duration: 5000,
			});
		},
	});

	return {
		rate,
		isPending,
		ratings,
	};
}