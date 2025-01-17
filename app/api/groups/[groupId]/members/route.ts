import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { groupId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const members = await prisma.membership.findMany({
			where: {
				groupId,
			},
			include: {
				user: {
					select: {
						id: true,
						clerkId: true,
						firstName: true,
						lastName: true,
						email: true,
					},
				},
			},
		});

		return NextResponse.json(members);
	} catch (error) {
		console.error('Failed to fetch members:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch members' },
			{ status: 500 }
		);
	}
}