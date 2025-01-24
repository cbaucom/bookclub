import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
	request: Request,
	context: { params: { groupId: string; bookId: string } }
) {
	try {
		const user = await getAuthenticatedUser();
		const params = context.params;

		if (!user) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId: params.groupId,
			},
		});

		if (!membership) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const ratings = await prisma.rating.findMany({
			where: {
				bookId: params.bookId,
			},
			include: {
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return NextResponse.json(ratings);
	} catch (error) {
		console.error('[RATINGS_GET]', error);
		return new NextResponse('Internal Error', { status: 500 });
	}
}

export async function POST(
	request: Request,
	context: { params: { groupId: string; bookId: string } }
) {
	try {
		const user = await getAuthenticatedUser();
		const params = context.params;
		const json = await request.json();

		if (!user) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId: params.groupId,
			},
		});

		if (!membership) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const rating = await prisma.rating.upsert({
			where: {
				bookId_userId: {
					userId: user.id,
					bookId: params.bookId,
				},
			},
			update: {
				rating: json.rating,
				review: json.review,
			},
			create: {
				rating: json.rating,
				review: json.review,
				userId: user.id,
				bookId: params.bookId,
			},
		});

		return NextResponse.json(rating);
	} catch (error) {
		console.error('[RATING_POST]', error);
		return new NextResponse('Internal Error', { status: 500 });
	}
}