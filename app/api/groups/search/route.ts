import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const query = searchParams.get('q');

		if (!query) {
			return NextResponse.json([]);
		}

		const groups = await prisma.group.findMany({
			where: {
				OR: [
					{
						name: {
							contains: query,
						},
					},
					{
						description: {
							contains: query,
						},
					},
				],
				privacy: 'PUBLIC',
			},
			include: {
				members: {
					where: {
						userId: user.id,
					},
				},
				_count: {
					select: {
						members: true,
					},
				},
			},
		});

		return NextResponse.json(
			groups.map((group) => ({
				id: group.id,
				name: group.name,
				description: group.description,
				privacy: group.privacy,
				_count: group._count,
				isMember: group.members.length > 0,
			}))
		);
	} catch (error) {
		console.error('Failed to search groups:', error);
		return NextResponse.json(
			{ error: 'Failed to search groups' },
			{ status: 500 }
		);
	}
}