import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
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
		const membership = await prisma.membership.findUnique({
			where: {
				userId_groupId: {
					userId: user.id,
					groupId,
				},
			},
		});

		if (!membership || membership.role === 'MEMBER') {
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

		if (!process.env.NEXT_PUBLIC_URL) {
			throw new Error('NEXT_PUBLIC_URL environment variable is not set');
		}

		// Generate invite link
		const inviteLink = `${process.env.NEXT_PUBLIC_URL}/invite/${invitation.id}`;

		try {
			// Send email
			console.log('Attempting to send email to:', email);
			const emailResponse = await resend.emails.send({
				from: 'BookClub <onboarding@resend.dev>', // Use onboarding domain first
				to: email,
				subject: `Join ${group.name} on BookClub`,
				html: await renderInvitationEmail({
					inviterName: user.firstName ? `${user.firstName} ${user.lastName}` : 'Someone',
					groupName: group.name,
					inviteLink,
				}),
			});
			console.log('Email sent successfully:', emailResponse);
		} catch (emailError) {
			console.error('Failed to send invitation email:', emailError);
			// Continue even if email fails - the invitation is still created
		}

		return NextResponse.json(invitation);
	} catch (error) {
		console.error('Failed to create invitation:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to create invitation' },
			{ status: 500 }
		);
	}
}