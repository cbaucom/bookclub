import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
	request: Request,
	context: { params: Promise<{ noteId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		const { noteId } = await context.params;
		const { content, parentId } = await request.json();

		// Check if the note exists and if the user is a member of the group
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

		// If this is a reply, verify the parent comment exists and belongs to this note
		if (parentId) {
			const parentComment = await prisma.comment.findFirst({
				where: {
					id: parentId,
					noteId,
				},
			});

			if (!parentComment) {
				return NextResponse.json(
					{ error: 'Parent comment not found' },
					{ status: 404 }
				);
			}
		}

		const comment = await prisma.comment.create({
			data: {
				content,
				noteId,
				userId: user.id,
				parentId,
			},
			include: {
				user: {
					select: {
						firstName: true,
						lastName: true,
						clerkId: true,
					},
				},
				reactions: {
					include: {
						user: {
							select: {
								firstName: true,
								lastName: true,
								clerkId: true,
							},
						},
					},
				},
				replies: {
					include: {
						user: {
							select: {
								firstName: true,
								lastName: true,
								clerkId: true,
							},
						},
						reactions: {
							include: {
								user: {
									select: {
										firstName: true,
										lastName: true,
										clerkId: true,
									},
								},
							},
						},
					},
				},
			},
		});

		return NextResponse.json(comment);
	} catch (error) {
		console.error('Failed to create comment:', error);
		return NextResponse.json(
			{ error: 'Failed to create comment' },
			{ status: 500 }
		);
	}
}