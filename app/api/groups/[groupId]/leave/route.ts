import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { groupId } = await context.params;

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
				{ error: 'You are not a member of this group' },
				{ status: 403 }
			);
		}

		// Check if user is the last admin
		if (membership.role === 'ADMIN') {
			const adminCount = await prisma.membership.count({
				where: {
					groupId,
					role: 'ADMIN',
				},
			});

			if (adminCount === 1) {
				return NextResponse.json(
					{ error: 'Cannot leave group as the last admin. Please delete the group instead.' },
					{ status: 400 }
				);
			}
		}

		// Delete the membership
		await prisma.membership.delete({
			where: {
				userId_groupId: {
					userId: user.id,
					groupId,
				},
			},
		});

		return NextResponse.json({ message: 'Successfully left group' });
	} catch (error) {
		console.error('Failed to leave group:', error);
		return NextResponse.json(
			{ error: 'Failed to leave group' },
			{ status: 500 }
		);
	}
}