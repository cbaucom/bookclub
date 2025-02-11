import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMemberOfGroup, getAuthenticatedUser } from '@/lib/auth';
import { getBookDetails } from '@/lib/google-books';

interface AddBooksRequest {
	bookIds: string[];
}

// Helper function to get next valid bracket size
function getNextValidBracketSize(currentSize: number): number {
	const validSizes = [2, 4, 8, 16];
	return validSizes.find(size => size > currentSize) || validSizes[validSizes.length - 1];
}

export async function POST(
	request: Request,
	context: { params: Promise<{ groupId: string; pollId: string }> }
) {
	try {
		console.log('[POLL_ADD_BOOKS] Starting request');

		const dbUser = await getAuthenticatedUser();
		console.log('[POLL_ADD_BOOKS] User:', dbUser?.id);

		if (!dbUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, pollId } = await context.params;
		console.log('[POLL_ADD_BOOKS] Group:', groupId, 'Poll:', pollId);

		const canAccess = await isMemberOfGroup(dbUser.id, groupId);
		console.log('[POLL_ADD_BOOKS] Can access:', canAccess);

		if (!canAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		console.log('[POLL_ADD_BOOKS] Request body:', body);

		const { bookIds } = body as AddBooksRequest;
		console.log('[POLL_ADD_BOOKS] Book IDs to add:', bookIds);

		if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
			return NextResponse.json(
				{ error: 'No books provided' },
				{ status: 400 }
			);
		}

		// Verify the poll exists and belongs to this group
		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
			include: { options: true },
		});
		console.log('[POLL_ADD_BOOKS] Found poll:', poll?.id, 'Status:', poll?.status);

		if (!poll || poll.groupId !== groupId) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		// Check if poll has started
		if (new Date(poll.startDate) <= new Date()) {
			return NextResponse.json(
				{ error: 'Cannot add books after poll has started' },
				{ status: 400 }
			);
		}

		// For bracket polls, validate that adding these books won't exceed the next valid bracket size
		if (poll.votingMethod === 'BRACKET') {
			const totalBooksAfterAdd = poll.options.length + bookIds.length;
			const nextValidSize = getNextValidBracketSize(poll.options.length);

			if (totalBooksAfterAdd > nextValidSize) {
				return NextResponse.json({
					error: `Cannot add ${bookIds.length} books. The next valid bracket size is ${nextValidSize} books. You can add ${nextValidSize - poll.options.length} more books.`
				}, { status: 400 });
			}
		}

		// First, ensure all books exist in our database
		console.log('[POLL_ADD_BOOKS] Ensuring books exist in database...');
		await Promise.all(
			bookIds.map(async (bookId) => {
				const existingBook = await prisma.book.findUnique({
					where: { id: bookId },
				});

				if (!existingBook) {
					console.log('[POLL_ADD_BOOKS] Fetching book details for:', bookId);
					const bookDetails = await getBookDetails(bookId);
					if (bookDetails) {
						console.log('[POLL_ADD_BOOKS] Creating new book:', bookId);
						await prisma.book.upsert({
							where: { id: bookId },
							update: {},
							create: {
								id: bookId,
								title: bookDetails.title,
								author: bookDetails.authors?.[0] || 'Unknown',
								description: bookDetails.description || '',
								imageUrl: bookDetails.imageLinks?.thumbnail || '',
								pageCount: bookDetails.pageCount || 0,
								amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(
									bookDetails.title + ' ' + (bookDetails.authors?.[0] || '')
								)}`,
							},
						});
					} else {
						throw new Error(`Could not fetch details for book: ${bookId}`);
					}
				}
			})
		);

		// Now add books to the poll
		console.log('[POLL_ADD_BOOKS] Starting to add books to poll...');
		const newOptions = await Promise.all(
			bookIds.map(async (bookId) => {
				try {
					// Check if book already exists in poll
					const existingOption = poll.options.find(
						(option) => option.bookId === bookId
					);
					if (existingOption) {
						console.log('[POLL_ADD_BOOKS] Book already exists in poll:', bookId);
						return existingOption;
					}

					console.log('[POLL_ADD_BOOKS] Adding new book to poll:', bookId);
					// Add new book to poll
					return prisma.pollOption.create({
						data: {
							pollId,
							bookId,
							userId: dbUser.id,
						},
						include: {
							book: {
								select: {
									id: true,
									title: true,
									author: true,
									imageUrl: true,
								},
							},
							votes: {
								select: {
									userId: true,
									value: true,
									user: {
										select: {
											clerkId: true,
										},
									},
								},
							},
							user: {
								select: {
									id: true,
									clerkId: true,
								},
							},
						},
					});
				} catch (err) {
					console.error('[POLL_ADD_BOOKS] Error adding book to poll:', bookId, err);
					throw err;
				}
			})
		);

		console.log('[POLL_ADD_BOOKS] Successfully added books to poll:', newOptions.map(opt => opt.bookId));
		return NextResponse.json(newOptions);
	} catch (error) {
		console.error('[POLL_ADD_BOOKS] Error:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ groupId: string; pollId: string }> }
) {
	try {
		const dbUser = await getAuthenticatedUser();
		if (!dbUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, pollId } = await context.params;
		const canAccess = await isMemberOfGroup(dbUser.id, groupId);
		if (!canAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Verify the poll exists and belongs to this group
		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
		});

		if (!poll || poll.groupId !== groupId) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		// Check if poll has started
		if (new Date(poll.startDate) <= new Date()) {
			return NextResponse.json(
				{ error: 'Cannot remove books after poll has started' },
				{ status: 400 }
			);
		}

		const { bookId } = (await request.json()) as { bookId: string };

		// Remove the book from the poll
		await prisma.pollOption.delete({
			where: {
				pollId_bookId: {
					pollId,
					bookId,
				},
			},
		});

		return NextResponse.json({ message: 'Book removed from poll' });
	} catch (error) {
		console.error('[POLL_REMOVE_BOOK] Error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}