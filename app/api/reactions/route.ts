import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { emoji, noteId, commentId } = await request.json();

		if (!emoji) {
			return NextResponse.json(
				{ error: 'Emoji is required' },
				{ status: 400 }
			);
		}

		if (!noteId && !commentId) {
			return NextResponse.json(
				{ error: 'Either noteId or commentId is required' },
				{ status: 400 }
			);
		}

		// Check if the user has access to the note/comment
		if (noteId) {
			const note = await prisma.note.findFirst({
				where: {
					id: noteId,
					book: {
						groups: {
							some: {
								group: {
									members: {
										some: {
											userId: user.id,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!note) {
				return NextResponse.json(
					{ error: 'Note not found or you do not have access' },
					{ status: 404 }
				);
			}
		}

		if (commentId) {
			const comment = await prisma.comment.findFirst({
				where: {
					id: commentId,
					note: {
						book: {
							groups: {
								some: {
									group: {
										members: {
											some: {
												userId: user.id,
											},
										},
									},
								},
							},
						},
					},
				},
			});

			if (!comment) {
				return NextResponse.json(
					{ error: 'Comment not found or you do not have access' },
					{ status: 404 }
				);
			}
		}

		const reaction = await prisma.reaction.create({
			data: {
				emoji,
				userId: user.id,
				...(noteId ? { noteId } : {}),
				...(commentId ? { commentId } : {}),
			},
			include: {
				user: true,
			},
		});

		return NextResponse.json(reaction);
	} catch (error) {
		console.error('Failed to create reaction:', error);
		return NextResponse.json(
			{ error: 'Failed to create reaction' },
			{ status: 500 }
		);
	}
}