import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
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
				group: {
					select: {
						name: true,
					},
				},
				invitedBy: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
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

		return NextResponse.json({
			groupName: invitation.group.name,
			inviterName: invitation.invitedBy.firstName
				? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
				: 'Someone',
		});
	} catch (error) {
		console.error('Failed to fetch invitation:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch invitation' },
			{ status: 500 }
		);
	}
}