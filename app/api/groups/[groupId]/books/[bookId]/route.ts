import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Rating } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { fetchCommentReplies } from '@/lib/comments';

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string; bookId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { groupId, bookId } = await context.params;

		if (!user) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const membership = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				groupId,
			},
		});

		if (!membership) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const bookInGroup = await prisma.bookInGroup.findUnique({
			where: {
				bookId_groupId: {
					bookId,
					groupId,
				},
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

		// Fetch all replies for top-level comments
		const notesWithReplies = await Promise.all(
			book.notes.map(async (note) => ({
				...note,
				comments: await Promise.all(
					note.comments.map(async (comment) => ({
						...comment,
						replies: await fetchCommentReplies(comment.id),
					}))
				),
			}))
		);

		const userRating = book.ratings.find((r: Rating) => r.userId === user.id);
		const averageRating =
			book.ratings.reduce((acc: number, r: Rating) => acc + r.rating, 0) / book.ratings.length;

		return NextResponse.json({
			...book,
			notes: notesWithReplies,
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
	context: { params: Promise<{ groupId: string; bookId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { groupId, bookId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

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

		await prisma.bookInGroup.delete({
			where: {
				bookId_groupId: {
					bookId,
					groupId,
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