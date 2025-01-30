import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';

interface ReactionTarget {
	noteId?: string;
	commentId?: string;
}

interface CreateReactionData extends ReactionTarget {
	emoji: string;
}

async function createReaction(data: CreateReactionData) {
	const response = await fetch(`${BASE_URL}/api/reactions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to create reaction');
	}

	return response.json();
}

async function deleteReaction(reactionId: string) {
	const response = await fetch(`${BASE_URL}/api/reactions/${reactionId}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to delete reaction');
	}

	return response.json();
}

export function useReactions(groupId: string) {
	const queryClient = useQueryClient();

	const invalidateQueries = () => {
		queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
		queryClient.invalidateQueries({ queryKey: ['books', groupId] });
		queryClient.invalidateQueries({ queryKey: ['book'] });
	};

	const createMutation = useMutation({
		mutationFn: createReaction,
		onSuccess: () => {
			invalidateQueries();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteReaction,
		onSuccess: () => {
			invalidateQueries();
		},
	});

	return {
		createMutation,
		deleteMutation,
	};
}