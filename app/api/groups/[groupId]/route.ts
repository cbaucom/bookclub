import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	const user = await getAuthenticatedUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { groupId } = await context.params;

	if (!groupId) {
		return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
	}

	try {
		// Check if user is a member of the group
		const membership = await prisma.membership.findFirst({
			where: {
				groupId,
				userId: user.id,
			},
			include: {
				group: true,
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'You do not have access to this group' },
				{ status: 403 }
			);
		}

		return NextResponse.json({
			...membership.group,
			role: membership.role,
		});
	} catch (error) {
		console.error('[GROUP_GET]', error);
		return NextResponse.json(
			{ error: 'Failed to fetch group' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	const user = await getAuthenticatedUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { groupId } = await context.params;

	if (!groupId) {
		return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
	}

	try {
		console.log('[GROUPS_DELETE] Checking membership for:', {
			userId: user.id,
			groupId,
		});

		// Check if user is an admin of the group
		const membership = await prisma.membership.findFirst({
			where: {
				groupId,
				userId: user.id,
				role: 'ADMIN',
			},
		});

		console.log('[GROUPS_DELETE] Membership found:', membership);

		if (!membership) {
			// Let's check if they're a member at all
			const anyMembership = await prisma.membership.findFirst({
				where: {
					groupId,
					userId: user.id,
				},
			});

			console.log('[GROUPS_DELETE] Any membership found:', anyMembership);

			return NextResponse.json(
				{
					error: 'You do not have permission to delete this group',
					details: anyMembership ? 'Not an admin' : 'Not a member'
				},
				{ status: 403 }
			);
		}

		await prisma.group.delete({
			where: {
				id: groupId,
			},
		});

		return NextResponse.json({ message: 'Group deleted' });
	} catch (error) {
		console.error('[GROUPS_DELETE]', error);
		return NextResponse.json(
			{ error: 'Failed to delete group' },
			{ status: 500 }
		);
	}
}