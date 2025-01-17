import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
	request: Request,
	context: { params: Promise<{ inviteId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { inviteId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const invitation = await prisma.invitation.findUnique({
			where: { id: inviteId },
			include: {
				group: true,
			},
		});

		if (!invitation) {
			return NextResponse.json(
				{ error: 'Invitation not found' },
				{ status: 404 }
			);
		}

		if (invitation.expiresAt < new Date()) {
			return NextResponse.json(
				{ error: 'Invitation has expired' },
				{ status: 410 }
			);
		}

		if (process.env.NODE_ENV === 'production' && invitation.email !== user.email) {
			return NextResponse.json(
				{ error: 'This invitation is for a different email address' },
				{ status: 403 }
			);
		}

		// Check if user is already a member
		const existingMembership = await prisma.membership.findUnique({
			where: {
				userId_groupId: {
					userId: user.id,
					groupId: invitation.groupId,
				},
			},
		});

		if (existingMembership) {
			return NextResponse.json(
				{ error: 'You are already a member of this group' },
				{ status: 400 }
			);
		}

		// Create membership
		await prisma.membership.create({
			data: {
				userId: user.id,
				groupId: invitation.groupId,
				role: 'MEMBER',
			},
		});

		// Delete the invitation
		await prisma.invitation.delete({
			where: { id: inviteId },
		});

		return NextResponse.json({ groupId: invitation.groupId });
	} catch (error) {
		console.error('Failed to accept invitation:', error);
		return NextResponse.json(
			{ error: 'Failed to accept invitation' },
			{ status: 500 }
		);
	}
}