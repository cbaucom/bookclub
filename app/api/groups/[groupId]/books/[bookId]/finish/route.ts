import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
	request: Request,
	context: { params: { groupId: string; bookId: string } }
) {
	try {
		const user = await getAuthenticatedUser();
		const { groupId, bookId } = context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is a member of the group
		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId,
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'You do not have access to this group' },
				{ status: 403 }
			);
		}

		// Update the book status to PREVIOUS and set the end date
		const updatedBook = await prisma.bookInGroup.update({
			where: {
				bookId_groupId: {
					bookId,
					groupId,
				},
			},
			data: {
				status: 'PREVIOUS',
				endDate: new Date(),
			},
			include: {
				book: true,
			},
		});

		return NextResponse.json(updatedBook);
	} catch (error) {
		console.error('Failed to mark book as finished:', error);
		return NextResponse.json(
			{ error: 'Failed to mark book as finished' },
			{ status: 500 }
		);
	}
}