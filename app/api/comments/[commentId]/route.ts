import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(
	request: Request,
	context: { params: Promise<{ commentId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { commentId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) {
			return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
		}

		if (comment.userId !== user.id) {
			return NextResponse.json(
				{ error: 'You can only edit your own comments' },
				{ status: 403 }
			);
		}

		const data = await request.json();
		const updatedComment = await prisma.comment.update({
			where: { id: commentId },
			data: { content: data.content },
			include: {
				user: true,
			},
		});

		return NextResponse.json(updatedComment);
	} catch (error) {
		console.error('Error updating comment:', error);
		return NextResponse.json(
			{ error: 'Failed to update comment' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ commentId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { commentId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) {
			return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
		}

		if (comment.userId !== user.id) {
			return NextResponse.json(
				{ error: 'You can only delete your own comments' },
				{ status: 403 }
			);
		}

		await prisma.comment.delete({
			where: { id: commentId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting comment:', error);
		return NextResponse.json(
			{ error: 'Failed to delete comment' },
			{ status: 500 }
		);
	}
}