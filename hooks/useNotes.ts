import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '@/lib/constants';
import type { Note } from '@prisma/client';

interface CreateNoteData {
	content: string;
	bookId: string;
}

async function createNote(data: CreateNoteData): Promise<Note> {
	const response = await fetch(`${BASE_URL}/api/books/${data.bookId}/notes`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error('Failed to create note');
	}

	return response.json();
}

export function useNotes(bookId: string, groupId: string) {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: createNote,
		onSuccess: () => {
			// Invalidate all relevant queries
			queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
			queryClient.invalidateQueries({ queryKey: ['books', groupId] });
		},
	});

	return {
		createMutation,
	};
}