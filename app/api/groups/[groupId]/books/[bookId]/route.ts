import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Rating } from '@prisma/client';
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

		const bookInGroup = await prisma.bookInGroup.findUnique({
			where: {
				bookId_groupId: {
					bookId: params.bookId,
					groupId: params.groupId,
				},
			},
			include: {
				book: {
					include: {
						ratings: {
							include: {
								user: {
									select: {
										id: true,
										firstName: true,
										lastName: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!bookInGroup?.book) {
			return new NextResponse('Book not found', { status: 404 });
		}

		const book = bookInGroup.book;
		const userRating = book.ratings.find((r: Rating) => r.userId === user.id);
		const averageRating =
			book.ratings.reduce((acc: number, r: Rating) => acc + r.rating, 0) / book.ratings.length;

		return NextResponse.json({
			...book,
			subtitle: book.subtitle,
			pageCount: book.pageCount,
			categories: book.categories,
			textSnippet: book.textSnippet,
			userRating: userRating?.rating || 0,
			averageRating: Number.isNaN(averageRating) ? 0 : averageRating,
			totalRatings: book.ratings.length,
			status: bookInGroup.status,
			startDate: bookInGroup.startDate,
			endDate: bookInGroup.endDate,
		});
	} catch (error) {
		console.error('[BOOK_GET]', error);
		return new NextResponse('Internal Error', { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	context: { params: { groupId: string; bookId: string } }
) {
	try {
		const user = await getAuthenticatedUser();
		const params = context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId: params.groupId,
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'You do not have access to this group' },
				{ status: 403 }
			);
		}

		await prisma.bookInGroup.delete({
			where: {
				bookId_groupId: {
					bookId: params.bookId,
					groupId: params.groupId,
				},
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Failed to delete book:', error);
		return NextResponse.json(
			{ error: 'Failed to delete book' },
			{ status: 500 }
		);
	}
}