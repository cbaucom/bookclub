import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, checkGroupMembership } from '@/lib/auth';
import { BookStatus } from '@prisma/client';

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

		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') || 'CURRENT';

		console.log('[GROUPS_BOOKS_GET] Fetching books with status:', status);

		// Validate status
		if (status !== 'CURRENT' && status !== 'PREVIOUS' && status !== 'UPCOMING') {
			console.log('[GROUPS_BOOKS_GET] Invalid status:', status);
			return NextResponse.json(
				{ error: 'Invalid status. Must be one of: CURRENT, PREVIOUS, UPCOMING' },
				{ status: 400 }
			);
		}

		// Check if user is a member of the group
		const membership = await checkGroupMembership(user.id, groupId);

		if (!membership) {
			return NextResponse.json(
				{ error: 'You do not have access to this group' },
				{ status: 403 }
			);
		}

		// Get books by status with ratings
		const books = await prisma.bookInGroup.findMany({
			where: {
				groupId,
				status,
			},
			include: {
				book: {
					include: {
						ratings: {
							select: {
								rating: true,
								userId: true,
							},
						},
					},
				},
			},
			orderBy: {
				startDate: 'desc',
			},
		});

		console.log('[GROUPS_BOOKS_GET] Found books:', books.length);

		// Calculate average ratings and user ratings
		const booksWithRatings = books.map((bookInGroup) => {
			const ratings = bookInGroup.book.ratings;
			const totalRatings = ratings.length;
			const averageRating = totalRatings > 0
				? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
				: null;
			const userRating = ratings.find(r => r.userId === user.id)?.rating || null;

			return {
				...bookInGroup.book,
				subtitle: bookInGroup.book.subtitle,
				pageCount: bookInGroup.book.pageCount,
				categories: bookInGroup.book.categories,
				textSnippet: bookInGroup.book.textSnippet,
				status: bookInGroup.status,
				startDate: bookInGroup.startDate,
				endDate: bookInGroup.endDate,
				averageRating,
				totalRatings,
				userRating,
			};
		});

		return NextResponse.json(booksWithRatings);
	} catch (error) {
		// Ensure we're logging a valid object
		const errorDetails = {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			error: JSON.stringify(error, Object.getOwnPropertyNames(error))
		};

		console.error('[GROUPS_BOOKS_GET] Error:', errorDetails);
		return NextResponse.json(
			{ error: errorDetails.message },
			{ status: 500 }
		);
	}
}

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

		const data = await request.json();
		console.log('Received book data:', data);

		const { title, author, description, imageUrl, amazonUrl, status, subtitle, pageCount, categories, textSnippet } = data;

		if (!title || !author) {
			return NextResponse.json(
				{ error: 'Title and author are required' },
				{ status: 400 }
			);
		}

		// Check if user is a member of the group
		const membership = await checkGroupMembership(user.id, groupId);

		if (!membership) {
			return NextResponse.json(
				{ error: 'You must be a member to add books' },
				{ status: 403 }
			);
		}

		// First, try to find an existing book
		const existingBook = await prisma.book.findFirst({
			where: {
				title: {
					equals: title.trim(),
				},
				author: {
					equals: author.trim(),
				},
			},
		});

		// Then check if this book is already in the group
		if (existingBook) {
			const existingBookInGroup = await prisma.bookInGroup.findFirst({
				where: {
					bookId: existingBook.id,
					groupId,
				},
			});

			if (existingBookInGroup) {
				return NextResponse.json(
					{ error: 'Book already exists in this group' },
					{ status: 400 }
				);
			}
		}

		// Create or get the book
		const book = existingBook || await prisma.book.create({
			data: {
				title: title.trim(),
				author: author.trim(),
				description: description?.trim(),
				imageUrl: imageUrl || null,
				amazonUrl: amazonUrl || null,
				subtitle: subtitle || null,
				pageCount: pageCount || null,
				categories: categories || null,
				textSnippet: textSnippet || null,
			},
		});

		// Add the book to the group with dates based on status
		const bookInGroupData = {
			bookId: book.id,
			groupId,
			status: (status as BookStatus) || 'UPCOMING',
			...(status === 'PREVIOUS'
				? { startDate: new Date(), endDate: new Date() }
				: status === 'CURRENT'
					? { startDate: new Date() }
					: {}),
		};

		const newBookInGroup = await prisma.bookInGroup.create({
			data: bookInGroupData,
			include: {
				book: true,
			},
		});

		console.log('Created book in group:', newBookInGroup);

		// Format the response to match the expected Book type
		const response = {
			id: newBookInGroup.book.id,
			title: newBookInGroup.book.title,
			subtitle: newBookInGroup.book.subtitle,
			author: newBookInGroup.book.author,
			description: newBookInGroup.book.description,
			imageUrl: newBookInGroup.book.imageUrl,
			amazonUrl: newBookInGroup.book.amazonUrl,
			pageCount: newBookInGroup.book.pageCount,
			categories: newBookInGroup.book.categories,
			textSnippet: newBookInGroup.book.textSnippet,
			startDate: newBookInGroup.startDate,
			endDate: newBookInGroup.endDate,
			status: newBookInGroup.status,
		};

		console.log('Sending response:', response);

		return NextResponse.json(response);
	} catch (error) {
		// Ensure we're logging a valid object
		const errorDetails = {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			error: JSON.stringify(error, Object.getOwnPropertyNames(error))
		};

		console.error('Failed to add book:', errorDetails);

		return NextResponse.json(
			{ error: errorDetails.message },
			{ status: 500 }
		);
	}
}