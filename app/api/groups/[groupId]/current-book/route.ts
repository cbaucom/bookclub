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

		// Check if user is a member of the group
		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId,
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'You do not have access to this group' },
				{ status: 403 }
			);
		}

		// Get the current book
		const currentBook = await prisma.bookInGroup.findFirst({
			where: {
				groupId,
				status: 'CURRENT',
			},
			include: {
				book: {
					include: {
						notes: {
							include: {
								user: true,
							},
							orderBy: {
								createdAt: 'desc',
							},
						},
						ratings: {
							select: {
								rating: true,
								userId: true,
							},
						},
					},
				},
			},
		});

		if (!currentBook) {
			return NextResponse.json(null);
		}

		// Calculate ratings
		const ratings = currentBook.book.ratings;
		const totalRatings = ratings.length;
		const averageRating = totalRatings > 0
			? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
			: null;
		const userRating = ratings.find(r => r.userId === user.id)?.rating || null;

		return NextResponse.json({
			id: currentBook.book.id,
			title: currentBook.book.title,
			author: currentBook.book.author,
			imageUrl: currentBook.book.imageUrl,
			amazonUrl: currentBook.book.amazonUrl,
			description: currentBook.book.description,
			startDate: currentBook.startDate,
			endDate: currentBook.endDate,
			averageRating,
			totalRatings,
			userRating,
			notes: currentBook.book.notes.map((note) => ({
				id: note.id,
				content: note.content,
				userId: note.userId,
				bookId: note.bookId,
				createdAt: note.createdAt,
				user: {
					firstName: note.user.firstName,
					lastName: note.user.lastName,
				},
			})),
		});
	} catch (error) {
		console.error('[GROUPS_CURRENT_BOOK]', error);
		return NextResponse.json(
			{ error: 'Failed to fetch current book' },
			{ status: 500 }
		);
	}
}