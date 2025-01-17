import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function DELETE(
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

		// Delete the book from the group
		await prisma.bookInGroup.delete({
			where: {
				bookId_groupId: {
					bookId,
					groupId,
				},
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Failed to delete book:', error);
		return NextResponse.json(
			{ error: 'Failed to delete book' },
			{ status: 500 }
		);
	}
}