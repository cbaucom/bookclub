import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, checkGroupMembership } from '@/lib/auth';
import { resend } from '@/lib/resend';
import { renderInvitationEmail } from '@/emails/invitation-email';

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

		// Check if user is a member and has permission to invite
		const membership = await checkGroupMembership(user.id, groupId);

		if (!membership) {
			return NextResponse.json(
				{ error: 'You do not have permission to invite members' },
				{ status: 403 }
			);
		}

		const { email } = await request.json();

		if (!email) {
			return NextResponse.json(
				{ error: 'Email is required' },
				{ status: 400 }
			);
		}

		// Get group details for the email
		const group = await prisma.group.findUnique({
			where: { id: groupId },
			select: { name: true },
		});

		if (!group) {
			return NextResponse.json(
				{ error: 'Group not found' },
				{ status: 404 }
			);
		}

		// Create or update invitation
		const invitation = await prisma.invitation.upsert({
			where: {
				email_groupId: {
					email,
					groupId,
				},
			},
			update: {
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
			},
			create: {
				email,
				groupId,
				invitedById: user.id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
			},
		});

		// Send invitation email
		if (process.env.NODE_ENV === 'production') {
			try {
				const inviteLink = `${process.env.NEXT_PUBLIC_URL}/invite/${invitation.id}`;
				await resend.emails.send({
					from: 'BookClub <noreply@bookclub.com>',
					to: email,
					subject: `You've been invited to join ${group.name} on BookClub`,
					react: renderInvitationEmail({
						inviterName: user.firstName ? `${user.firstName} ${user.lastName}` : 'Someone',
						groupName: group.name,
						inviteLink,
					}),
				});
			} catch (error) {
				console.error('Failed to send invitation email:', error);
				// Don't return error, continue with invitation creation
			}
		}

		return NextResponse.json(invitation);
	} catch (error) {
		console.error('Failed to create invitation:', error);
		return NextResponse.json(
			{ error: 'Failed to create invitation' },
			{ status: 500 }
		);
	}
}