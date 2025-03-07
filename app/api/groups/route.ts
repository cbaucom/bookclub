import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

// Fetch all groups
export async function GET() {
	console.log('🎯 [GROUPS_GET] Route handler entered - URL:', process.env.VERCEL_URL || 'localhost');
	console.log('🎯 [GROUPS_GET] Environment:', process.env.NODE_ENV);
	try {
		console.log('[GROUPS_GET] Starting request');
		const user = await getAuthenticatedUser();
		console.log('[GROUPS_GET] Auth user details:', {
			id: user?.id,
			email: user?.email,
			clerkId: user?.clerkId
		});

		if (!user) {
			console.log('[GROUPS_GET] No authenticated user');
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('[GROUPS_GET] Constructing membership query for user:', user.id);

		const query = {
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
								status: 'CURRENT' as const,
							},
							include: {
								book: true,
							},
							take: 1,
						},
					},
				},
			},
		};

		console.log('[GROUPS_GET] Membership query:', JSON.stringify(query, null, 2));

		// Get all memberships and their associated groups
		const memberships = await prisma.membership.findMany(query);

		console.log('[GROUPS_GET] Raw memberships result:', JSON.stringify({
			query: 'SELECT * FROM Membership WHERE userId = ' + user.id,
			count: memberships.length,
			memberships: memberships.map(m => ({
				userId: m.userId,
				groupId: m.groupId,
				role: m.role,
				group: m.group ? {
					id: m.group.id,
					name: m.group.name,
					memberCount: m.group._count.members,
					currentBook: m.group.books[0]?.book || null
				} : null
			}))
		}, null, 2));

		console.log('[GROUPS_GET] Found memberships:', memberships.length);

		// Map to just the groups
		const groups = memberships.map((membership) => ({
			...membership.group,
			role: membership.role,
			_count: membership.group._count,
			currentBook: membership.group.books[0]?.book || null,
		}));

		console.log('[GROUPS_GET] Mapped groups:', groups.length);
		console.log('[GROUPS_GET] Groups details:', groups.map(g => ({
			id: g.id,
			name: g.name,
			role: g.role,
			memberCount: g._count.members,
			hasCurrentBook: !!g.currentBook
		})));

		return NextResponse.json(groups);
	} catch (error) {
		console.error('[GROUPS_GET] Error:', error);
		console.error('[GROUPS_GET] Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{ error: 'Failed to fetch groups' },
			{ status: 500 }
		);
	}
}

// Create a new group
export async function POST(
	request: NextRequest,
) {
	try {
		const user = await getAuthenticatedUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();

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