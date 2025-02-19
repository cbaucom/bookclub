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

async function updateNote(noteId: string, data: { content: string }) {
	const response = await fetch(`${BASE_URL}/api/notes/${noteId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error('Failed to update note');
	}

	return response.json();
}

async function deleteNote(noteId: string) {
	const response = await fetch(`${BASE_URL}/api/notes/${noteId}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error('Failed to delete note');
	}

	return response.json();
}

export function useNotes(bookId: string, groupId: string) {
	const queryClient = useQueryClient();

	const invalidateQueries = () => {
		queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
		queryClient.invalidateQueries({ queryKey: ['books', groupId] });
		queryClient.invalidateQueries({ queryKey: ['book', bookId, groupId] });
	};

	const createMutation = useMutation({
		mutationFn: createNote,
		onSuccess: () => {
			invalidateQueries();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ noteId, data }: { noteId: string; data: { content: string } }) =>
			updateNote(noteId, data),
		onSuccess: () => {
			invalidateQueries();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteNote,
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