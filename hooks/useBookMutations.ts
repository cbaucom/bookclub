import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';

async function deleteBook(groupId: string, bookId: string) {
	const response = await fetch(`/api/groups/${groupId}/books/${bookId}`, {
		method: 'DELETE',
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to delete book');
	}
	return response.json();
}

async function markBookAsFinished(bookId: string, groupId: string) {
	const response = await fetch(
		`/api/groups/${groupId}/books/${bookId}/finish`,
		{
			method: 'POST',
		}
	);
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to mark book as finished');
	}
	return response.json();
}

export function useBookMutations(bookId: string, groupId: string) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deleteBook(groupId, bookId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['books', groupId] });
			queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
			toaster.create({
				title: 'Book deleted',
				type: 'success',
				duration: 3000,
			});
		},
		onError: (error: Error) => {
			toaster.create({
				title: 'Failed to delete book',
				description: error.message,
				type: 'error',
				duration: 5000,
			});
		},
	});

	const finishMutation = useMutation({
		mutationFn: () => markBookAsFinished(bookId, groupId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['books', groupId] });
			queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
			toaster.create({
				title: 'Book marked as finished',
				type: 'success',
				duration: 3000,
			});
		},
		onError: (error: Error) => {
			toaster.create({
				title: 'Failed to mark book as finished',
				description: error.message,
				type: 'error',
				duration: 5000,
			});
		},
	});

	return {
		deleteMutation,
		finishMutation,
	};
}