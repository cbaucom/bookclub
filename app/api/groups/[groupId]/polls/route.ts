import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, isMemberOfGroup } from '@/lib/auth';
import { PollStatus, VotingMethod } from '@prisma/client';

interface CreatePollBody {
	title: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	votingMethod: VotingMethod;
	maxPoints?: number;
	bookIds?: string[];
	status?: PollStatus;
}

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	try {
		console.log('[POLLS_GET] Starting request');

		const dbUser = await getAuthenticatedUser();
		console.log('[POLLS_GET] Auth user:', dbUser?.id);

		if (!dbUser) {
			console.log('[POLLS_GET] No authenticated user');
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const params = await context.params;
		console.log('[POLLS_GET] Context params:', params);
		const { groupId } = params;
		console.log('[POLLS_GET] Group ID:', groupId);

		// Check if user is admin first
		const isAdmin = await isMemberOfGroup(dbUser.id, groupId, 'ADMIN');
		console.log('[POLLS_GET] Is admin:', isAdmin);

		// If not admin, check if they're at least a member
		if (!isAdmin) {
			const isMember = await isMemberOfGroup(dbUser.id, groupId);
			if (!isMember) {
				console.log('[POLLS_GET] Access denied');
				return new Response(JSON.stringify({ error: 'Forbidden' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		console.log('[POLLS_GET] About to query polls');

		// Get all polls with user data
		const polls = await prisma.poll.findMany({
			where: { groupId },
			include: {
				options: {
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
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		console.log('[POLLS_GET] Polls query result:', polls?.length ?? 'null');

		const response = new Response(JSON.stringify(polls || []), {
			headers: { 'Content-Type': 'application/json' }
		});

		console.log('[POLLS_GET] Response created');
		return response;
	} catch (error) {
		console.error('[POLLS_GET] Error:', error);
		console.error('[POLLS_GET] Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
		return new Response(JSON.stringify({ error: 'Internal Error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

export async function POST(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	try {
		console.log('[POLLS_POST] Starting request');

		const dbUser = await getAuthenticatedUser();
		console.log('[POLLS_POST] Auth user:', dbUser?.id);

		if (!dbUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId } = await context.params;
		console.log('[POLLS_POST] Group ID:', groupId);

		const isAdmin = await isMemberOfGroup(dbUser.id, groupId, 'ADMIN');
		console.log('[POLLS_POST] Is admin:', isAdmin);

		if (!isAdmin) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json() as CreatePollBody;
		console.log('[POLLS_POST] Raw request body:', body);

		const { title, description, startDate, endDate, votingMethod, maxPoints, bookIds, status } = body;

		console.log('[POLLS_POST] Parsed data:', {
			title,
			description,
			startDate,
			endDate,
			votingMethod,
			maxPoints,
			bookIdsCount: bookIds?.length,
			status,
		});

		// Validate required fields (fewer requirements for DRAFT status)
		if (!title || !votingMethod) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Create the poll first
		const poll = await prisma.poll.create({
			data: {
				title,
				description,
				startDate: startDate ? new Date(startDate) : new Date(),
				endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				votingMethod: VotingMethod[votingMethod as keyof typeof VotingMethod],
				maxPoints,
				groupId,
				status: status ? PollStatus[status as keyof typeof PollStatus] : PollStatus.PENDING,
			},
			include: {
				options: {
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
				},
			},
		});

		// If we have bookIds, add them to the poll
		if (bookIds?.length) {
			for (const googleBookId of bookIds) {
				try {
					// Try to find the book in our database first
					const existingBook = await prisma.book.findFirst({
						where: {
							OR: [
								{ id: googleBookId },
								{ amazonUrl: { contains: googleBookId } }
							]
						}
					});

					if (existingBook) {
						// Create poll option for existing book
						await prisma.pollOption.create({
							data: {
								pollId: poll.id,
								bookId: existingBook.id,
								userId: dbUser.id,
							},
						});
						continue;
					}

					// If not found, fetch from Google Books API
					const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${googleBookId}`);
					if (!response.ok) {
						console.error(`Failed to fetch book details for ID: ${googleBookId}`);
						continue;
					}

					const bookData = await response.json();
					const volumeInfo = bookData?.volumeInfo;
					if (!volumeInfo?.title) {
						console.error(`Invalid book data for ID: ${googleBookId}`);
						continue;
					}

					// Create the book
					const newBook = await prisma.book.create({
						data: {
							id: googleBookId,
							title: volumeInfo.title,
							subtitle: volumeInfo.subtitle || null,
							author: volumeInfo.authors?.[0] || 'Unknown',
							description: volumeInfo.description || null,
							imageUrl: volumeInfo.imageLinks?.thumbnail || null,
							pageCount: volumeInfo.pageCount || null,
							categories: volumeInfo.categories?.join(', ') || null,
							textSnippet: bookData.searchInfo?.textSnippet || null,
							amazonUrl: `https://books.google.com/books?id=${googleBookId}`,
						},
					});

					// Create poll option for new book
					await prisma.pollOption.create({
						data: {
							pollId: poll.id,
							bookId: newBook.id,
							userId: dbUser.id,
						},
					});
				} catch (error) {
					console.error(`Error processing book ${googleBookId}:`, error);
					// Continue with next book
					continue;
				}
			}
		}

		const updatedPoll = await prisma.poll.findUnique({
			where: { id: poll.id },
			include: {
				options: {
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
				},
			},
		});

		console.log('[POLLS_POST] Poll created successfully:', updatedPoll?.id);
		return NextResponse.json(updatedPoll);
	} catch (error) {
		console.error('[POLLS_POST] Error details:', {
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