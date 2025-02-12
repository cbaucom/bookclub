import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
	request: Request,
	context: { params: Promise<{ inviteId: string }> }
) {
	try {
		const { inviteId } = await context.params;
		const user = await getAuthenticatedUser();

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

		// Only check email match if user is authenticated
		if (user && process.env.NODE_ENV === 'production' && invitation.email !== user.email) {
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
			email: invitation.email,
		});
	} catch (error) {
		console.error('Failed to fetch invitation:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch invitation' },
			{ status: 500 }
		);
	}
}