import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { fetchCommentReplies } from '@/lib/comments';

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
				{ error: 'You are not a member of this group' },
				{ status: 403 }
			);
		}

		const currentBook = await prisma.bookInGroup.findFirst({
			where: {
				groupId,
				status: 'CURRENT',
			},
			include: {
				book: {
					include: {
						notes: {
							orderBy: {
								createdAt: 'desc',
							},
							include: {
								user: {
									select: {
										firstName: true,
										lastName: true,
										clerkId: true,
									},
								},
								reactions: {
									include: {
										user: {
											select: {
												firstName: true,
												lastName: true,
												clerkId: true,
											},
										},
									},
								},
								comments: {
									where: {
										parentId: null,
									},
									orderBy: {
										createdAt: 'asc',
									},
									include: {
										user: {
											select: {
												firstName: true,
												lastName: true,
												clerkId: true,
											},
										},
										reactions: {
											include: {
												user: {
													select: {
														firstName: true,
														lastName: true,
														clerkId: true,
													},
												},
											},
										},
									},
								},
							},
						},
						ratings: {
							where: {
								userId: user.id,
							},
							select: {
								rating: true,
							},
						},
						_count: {
							select: {
								ratings: true,
							},
						},
					},
				},
			},
		});

		if (!currentBook) {
			return NextResponse.json(null);
		}

		// Fetch all replies for top-level comments
		const notesWithReplies = await Promise.all(
			currentBook.book.notes.map(async (note) => ({
				...note,
				comments: await Promise.all(
					note.comments.map(async (comment) => ({
						...comment,
						replies: await fetchCommentReplies(comment.id),
					}))
				),
			}))
		);

		// Calculate average rating
		const ratings = await prisma.rating.findMany({
			where: {
				bookId: currentBook.bookId,
			},
			select: {
				rating: true,
			},
		});

		const averageRating =
			ratings.length > 0
				? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
				: undefined;

		const bookData = {
			...currentBook.book,
			notes: notesWithReplies,
		};
		const userRating = bookData.ratings[0]?.rating;

		const response = {
			...bookData,
			averageRating,
			totalRatings: bookData._count.ratings,
			userRating,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('Error fetching current book:', error);
		if (error instanceof Error) {
			console.error('Error details:', {
				message: error.message,
				stack: error.stack,
			});
		}
		return NextResponse.json(
			{ error: 'Failed to fetch current book' },
			{ status: 500 }
		);
	}
}