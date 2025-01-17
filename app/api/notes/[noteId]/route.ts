import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(
	request: Request,
	context: { params: Promise<{ noteId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { noteId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const note = await prisma.note.findUnique({
			where: { id: noteId },
		});

		if (!note) {
			return NextResponse.json({ error: 'Note not found' }, { status: 404 });
		}

		if (note.userId !== user.id) {
			return NextResponse.json(
				{ error: 'You can only edit your own notes' },
				{ status: 403 }
			);
		}

		const data = await request.json();
		const updatedNote = await prisma.note.update({
			where: { id: noteId },
			data: { content: data.content },
			include: {
				user: true,
			},
		});

		return NextResponse.json(updatedNote);
	} catch (error) {
		console.error('Error updating note:', error);
		return NextResponse.json(
			{ error: 'Failed to update note' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ noteId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { noteId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const note = await prisma.note.findUnique({
			where: { id: noteId },
		});

		if (!note) {
			return NextResponse.json({ error: 'Note not found' }, { status: 404 });
		}

		if (note.userId !== user.id) {
			return NextResponse.json(
				{ error: 'You can only delete your own notes' },
				{ status: 403 }
			);
		}

		await prisma.note.delete({
			where: { id: noteId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting note:', error);
		return NextResponse.json(
			{ error: 'Failed to delete note' },
			{ status: 500 }
		);
	}
}