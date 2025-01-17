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

		// Check if group exists
		const group = await prisma.group.findUnique({
			where: { id: groupId },
		});

		if (!group) {
			return NextResponse.json(
				{ error: 'Group not found' },
				{ status: 404 }
			);
		}

		// Check if user is already a member
		const existingMembership = await prisma.membership.findUnique({
			where: {
				userId_groupId: {
					userId: user.id,
					groupId,
				},
			},
		});

		if (existingMembership) {
			return NextResponse.json(
				{ error: 'You are already a member of this group' },
				{ status: 400 }
			);
		}

		// Check if group is private
		if (group.privacy === 'PRIVATE') {
			// For now, allow joining private groups if they have the ID
			// Later we can add invitation system here
		}

		// Create membership
		const membership = await prisma.membership.create({
			data: {
				userId: user.id,
				groupId,
				role: 'MEMBER',
			},
		});

		return NextResponse.json(membership);
	} catch (error) {
		console.error('Failed to join group:', error);
		return NextResponse.json(
			{ error: 'Failed to join group' },
			{ status: 500 }
		);
	}
}