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
		// Check if user is an admin of the group
		const membership = await prisma.membership.findFirst({
			where: {
				groupId,
				userId: user.id,
				role: 'ADMIN',
			},
		});

		if (!membership) {
			// Let's check if they're a member at all
			const anyMembership = await prisma.membership.findFirst({
				where: {
					groupId,
					userId: user.id,
				},
			});

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

export async function PUT(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	const { groupId } = await context.params;

	if (!groupId) {
		return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
	}

	const user = await getAuthenticatedUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const membership = await prisma.membership.findFirst({
		where: {
			groupId,
			userId: user.id,
		},
	});

	if (!membership) {
		return NextResponse.json(
			{ error: 'You do not have permission to update this group' },
			{ status: 403 }
		);
	}

	const { name, description } = await request.json();

	try {
		const updatedGroup = await prisma.group.update({
			where: { id: groupId },
			data: { name, description },
		});

		return NextResponse.json({
			...updatedGroup,
			role: membership.role,
		});
	} catch (error) {
		console.error('[GROUPS_UPDATE]', error);
		return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
	}
}
