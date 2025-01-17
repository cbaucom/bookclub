import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
	request: Request,
	context: { params: Promise<{ bookId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		const { bookId } = await context.params;
		const { content } = await request.json();

		// Check if the book exists and if the user is a member of the group
		const bookInGroup = await prisma.bookInGroup.findFirst({
			where: {
				bookId,
				group: {
					members: {
						some: {
							userId: user.id,
						},
					},
				},
			},
			include: {
				book: true,
				group: true,
			},
		});

		if (!bookInGroup) {
			return NextResponse.json(
				{ error: 'Book not found or you do not have access' },
				{ status: 404 }
			);
		}

		const note = await prisma.note.create({
			data: {
				content,
				bookId,
				userId: user.id,
			},
		});

		return NextResponse.json(note);
	} catch (error) {
		console.error('Failed to create note:', error);
		return NextResponse.json(
			{ error: 'Failed to create note' },
			{ status: 500 }
		);
	}
}