import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';

interface CreateCommentData {
	content: string;
	noteId: string;
	parentId?: string;
}

interface UpdateCommentData {
	content: string;
}

async function createComment(data: CreateCommentData) {
	const response = await fetch(`${BASE_URL}/api/notes/${data.noteId}/comments`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error('Failed to create comment');
	}

	const result = await response.json();
	return result;
}

async function updateComment(commentId: string, data: UpdateCommentData) {
	const response = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error('Failed to update comment');
	}

	return response.json();
}

async function deleteComment(commentId: string) {
	const response = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error('Failed to delete comment');
	}

	return response.json();
}

export function useComments(groupId: string) {
	const queryClient = useQueryClient();

	const invalidateQueries = () => {
		queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
		queryClient.invalidateQueries({ queryKey: ['books', groupId] });
		queryClient.invalidateQueries({ queryKey: ['book'] });
	};

	const createMutation = useMutation({
		mutationFn: createComment,
		onSuccess: () => {
			invalidateQueries();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentData }) =>
			updateComment(commentId, data),
		onSuccess: () => {
			invalidateQueries();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteComment,
		onSuccess: () => {
			invalidateQueries();
		},
	});

	return {
		createMutation,
		updateMutation,
		deleteMutation,
	};
}