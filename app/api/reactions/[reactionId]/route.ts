import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function DELETE(
	request: Request,
	context: { params: { reactionId: string } }
) {
	try {
		const user = await getAuthenticatedUser();
		const { reactionId } = context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const reaction = await prisma.reaction.findUnique({
			where: { id: reactionId },
		});

		if (!reaction) {
			return NextResponse.json(
				{ error: 'Reaction not found' },
				{ status: 404 }
			);
		}

		if (reaction.userId !== user.id) {
			return NextResponse.json(
				{ error: 'You can only delete your own reactions' },
				{ status: 403 }
			);
		}

		await prisma.reaction.delete({
			where: { id: reactionId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting reaction:', error);
		return NextResponse.json(
			{ error: 'Failed to delete reaction' },
			{ status: 500 }
		);
	}
}