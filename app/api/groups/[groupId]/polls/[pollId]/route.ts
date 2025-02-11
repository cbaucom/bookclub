import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isMemberOfGroup } from '@/lib/auth';
import { PollStatus } from '@prisma/client';

// Helper function to validate bracket size
function isValidBracketSize(numOptions: number): boolean {
	const validSizes = [2, 4, 8, 16];
	return validSizes.includes(numOptions);
}

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string; pollId: string }> }
) {
	try {
		const dbUser = await getAuthenticatedUser();
		if (!dbUser) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const { groupId, pollId } = await context.params;
		const canAccess = await isMemberOfGroup(dbUser.id, groupId);
		if (!canAccess) {
			return new NextResponse('Forbidden', { status: 403 });
		}

		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
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

		if (!poll || poll.groupId !== groupId) {
			return new NextResponse('Not Found', { status: 404 });
		}

		return NextResponse.json(poll);
	} catch (error) {
		console.error('[POLL_GET]', error);
		return new NextResponse('Internal Error', { status: 500 });
	}
}

export async function PATCH(
	request: Request,
	context: { params: Promise<{ groupId: string; pollId: string }> }
) {
	try {
		const dbUser = await getAuthenticatedUser();
		if (!dbUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, pollId } = await context.params;
		const isAdmin = await isMemberOfGroup(dbUser.id, groupId, 'ADMIN');
		if (!isAdmin) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { status } = body;

		// Get the current poll
		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
			include: { options: true }
		});

		if (!poll) {
			return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
		}

		// Additional validation when activating a pending poll
		if (poll.status === PollStatus.PENDING && status === PollStatus.ACTIVE) {
			if (!poll.startDate || !poll.endDate || poll.options.length < 2) {
				return NextResponse.json({
					error: 'Polls require start date, end date, and at least 2 books before activation'
				}, { status: 400 });
			}

			// Validate bracket size
			if (poll.votingMethod === 'BRACKET' && !isValidBracketSize(poll.options.length)) {
				return NextResponse.json({
					error: 'Bracket polls require exactly 2, 4, 8, or 16 books'
				}, { status: 400 });
			}

			// Initialize bracket matchups if this is a bracket poll
			if (poll.votingMethod === 'BRACKET') {
				// Shuffle the options to randomize matchups
				const shuffledOptions = [...poll.options].sort(() => Math.random() - 0.5);

				// Update each option with initial round (1) and matchup number
				await Promise.all(shuffledOptions.map(async (option, index) => {
					await prisma.pollOption.update({
						where: { id: option.id },
						data: {
							round: 1,
							matchup: Math.floor(index / 2) + 1
						}
					});
				}));
			}
		}

		const updatedPoll = await prisma.poll.update({
			where: { id: pollId },
			data: { status: status as PollStatus },
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
							},
						},
					},
				},
			},
		});

		return NextResponse.json(updatedPoll);
	} catch (error) {
		console.error('[POLL_PATCH]', error);
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
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const { groupId, pollId } = await context.params;
		const isAdmin = await isMemberOfGroup(dbUser.id, groupId, 'ADMIN');
		if (!isAdmin) {
			return new NextResponse('Forbidden', { status: 403 });
		}

		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
		});

		if (!poll || poll.groupId !== groupId) {
			return new NextResponse('Not Found', { status: 404 });
		}

		await prisma.poll.delete({
			where: { id: pollId },
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('[POLL_DELETE]', error);
		return new NextResponse('Internal Error', { status: 500 });
	}
}

export async function PUT(
	request: Request,
	context: { params: Promise<{ groupId: string; pollId: string }> }
) {
	try {
		const dbUser = await getAuthenticatedUser();
		if (!dbUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, pollId } = await context.params;
		const isAdmin = await isMemberOfGroup(dbUser.id, groupId, 'ADMIN');
		if (!isAdmin) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { title, description, startDate, endDate } = body;

		// Get the current poll
		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
		});

		if (!poll) {
			return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
		}

		// Update the poll
		const updatedPoll = await prisma.poll.update({
			where: { id: pollId },
			data: {
				...(title && { title }),
				...(description !== undefined && { description }),
				...(startDate && { startDate: new Date(startDate) }),
				...(endDate && { endDate: new Date(endDate) }),
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

		return NextResponse.json(updatedPoll);
	} catch (error) {
		console.error('[POLL_PUT]', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}