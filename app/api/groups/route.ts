import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

// Fetch all groups
export async function GET() {
	const user = await getAuthenticatedUser();

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get all memberships and their associated groups
	const memberships = await prisma.membership.findMany({
		where: {
			userId: user.id,
		},
		include: {
			group: {
				include: {
					_count: {
						select: {
							members: true,
						},
					},
					books: {
						where: {
							status: 'CURRENT',
						},
						include: {
							book: true,
						},
						take: 1,
					},
				},
			},
		},
	});

	// Map to just the groups
	const groups = memberships.map((membership) => ({
		...membership.group,
		role: membership.role,
		_count: membership.group._count,
		currentBook: membership.group.books[0]?.book || null,
	}));

	return NextResponse.json(groups);
}

// Create a new group
export async function POST(req: Request) {
	try {
		const user = await getAuthenticatedUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await req.json();

		// First create the group
		const newGroup = await prisma.group.create({
			data: {
				name: data.name,
				description: data.description,
				privacy: data.privacy || 'PUBLIC',
			},
		});

		// Then create the membership
		const membership = await prisma.membership.create({
			data: {
				userId: user.id,
				groupId: newGroup.id,
				role: 'ADMIN',
			},
			include: {
				user: true,
				group: true,
			},
		});

		return NextResponse.json(
			{
				...membership.group,
				role: membership.role,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('[GROUPS_CREATE]', error);
		return NextResponse.json(
			{ error: 'Failed to create group' },
			{ status: 500 }
		);
	}
}