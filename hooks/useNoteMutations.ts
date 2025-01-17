import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';

interface UpdateNoteData {
	content: string;
}

async function updateNote(noteId: string, data: UpdateNoteData) {
	const response = await fetch(`${BASE_URL}/api/notes/${noteId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to update note');
	}

	return response.json();
}

async function deleteNote(noteId: string) {
	const response = await fetch(`${BASE_URL}/api/notes/${noteId}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to delete note');
	}

	return response.json();
}

export function useNoteMutations(bookId: string, groupId: string) {
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: ({ noteId, data }: { noteId: string; data: UpdateNoteData }) =>
			updateNote(noteId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (noteId: string) => deleteNote(noteId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
		},
	});

	return {
		updateMutation,
		deleteMutation,
	};
}