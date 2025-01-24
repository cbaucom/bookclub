import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(
	request: Request,
	context: { params: Promise<{ groupId: string; bookId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const params = await context.params;
		const { groupId, bookId } = params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is an admin of the group
		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId,
				role: 'ADMIN',
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'Only group admins can modify book dates' },
				{ status: 403 }
			);
		}

		const { startDate, endDate } = await request.json();

		// Update the book dates
		const updatedBook = await prisma.bookInGroup.update({
			where: {
				bookId_groupId: {
					bookId,
					groupId,
				},
			},
			data: {
				startDate: startDate ? new Date(startDate + 'T12:00:00') : null,
				endDate: endDate ? new Date(endDate + 'T12:00:00') : null,
			},
			include: {
				book: true,
			},
		});

		return NextResponse.json(updatedBook);
	} catch (error) {
		console.error('Failed to update book dates:', error);
		return NextResponse.json(
			{ error: 'Failed to update book dates' },
			{ status: 500 }
		);
	}
}