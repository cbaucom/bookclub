import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VoteRequest } from '@/types';
import { isMemberOfGroup, getAuthenticatedUser } from '@/lib/auth';

export async function POST(
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

		const { pollOptionId, value } = (await request.json()) as VoteRequest;

		// Verify the poll option belongs to this poll and group
		const pollOption = await prisma.pollOption.findUnique({
			where: { id: pollOptionId },
			include: {
				poll: {
					include: {
						group: {
							include: {
								members: true
							}
						}
					}
				}
			},
		});

		if (!pollOption || pollOption.poll.id !== pollId || pollOption.poll.groupId !== groupId) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		if (pollOption.poll.status !== 'ACTIVE') {
			return NextResponse.json({ error: 'Poll is not active' }, { status: 400 });
		}

		// Get current vote if it exists
		const currentVote = await prisma.vote.findUnique({
			where: {
				userId_pollOptionId: {
					userId: dbUser.id,
					pollOptionId,
				},
			},
		});

		console.log('[POLL_VOTE] Current vote:', currentVote);
		console.log('[POLL_VOTE] Requested value:', value);

		// If removing vote (value === 0)
		if (value === 0) {
			if (currentVote) {
				await prisma.vote.delete({
					where: {
						userId_pollOptionId: {
							userId: dbUser.id,
							pollOptionId,
						},
					},
				});
				console.log('[POLL_VOTE] Vote removed successfully');
				return NextResponse.json({ message: 'Vote removed' });
			}
			return NextResponse.json({ message: 'No vote to remove' });
		}

		// For upvote/downvote, only allow one vote per poll
		if (pollOption.poll.votingMethod === 'UPVOTE_DOWNVOTE') {
			// Delete any existing votes for OTHER options in this poll
			await prisma.vote.deleteMany({
				where: {
					userId: dbUser.id,
					pollOption: {
						pollId,
						NOT: {
							id: pollOptionId,
						},
					},
				},
			});
		}

		// For bracket voting, only allow one vote per matchup
		if (pollOption.poll.votingMethod === 'BRACKET') {
			// Get all options in the same matchup
			const matchupOptions = await prisma.pollOption.findMany({
				where: {
					pollId,
					round: pollOption.round,
					matchup: pollOption.matchup,
				},
				include: {
					votes: true,
				},
			});

			// Delete any existing votes for other options in this matchup
			await prisma.vote.deleteMany({
				where: {
					userId: dbUser.id,
					pollOption: {
						id: {
							in: matchupOptions.map(opt => opt.id),
						},
					},
				},
			});

			// Check if this vote completes the matchup
			const votesAfterThis = matchupOptions.reduce((acc, opt) => {
				const existingVotes = opt.votes.length;
				const isCurrentOption = opt.id === pollOptionId ? 1 : 0;
				return acc + existingVotes + isCurrentOption;
			}, 0);

			// If all users have voted in this matchup
			if (votesAfterThis === matchupOptions.length * pollOption.poll.group.members.length) {
				// Find options with the highest votes
				const voteCounts = matchupOptions.map(opt => ({
					option: opt,
					votes: opt.votes.length + (opt.id === pollOptionId ? 1 : 0)
				}));

				const maxVotes = Math.max(...voteCounts.map(v => v.votes));
				const winners = voteCounts.filter(v => v.votes === maxVotes);

				// Randomly select winner if there's a tie
				const winner = winners[Math.floor(Math.random() * winners.length)].option;

				// Advance the winner to the next round
				const nextRound = (pollOption.round || 1) + 1;
				const nextMatchup = Math.ceil(pollOption.matchup! / 2);

				await prisma.pollOption.update({
					where: { id: winner.id },
					data: {
						round: nextRound,
						matchup: nextMatchup,
					},
				});

				// Check if this was the final round
				const remainingOptions = await prisma.pollOption.count({
					where: {
						pollId,
						round: nextRound,
					},
				});

				if (remainingOptions === 1) {
					// Update poll status to completed
					await prisma.poll.update({
						where: { id: pollId },
						data: {
							status: 'COMPLETED',
						},
					});
				}
			}
		}

		// Create or update the vote
		const vote = await prisma.vote.upsert({
			where: {
				userId_pollOptionId: {
					userId: dbUser.id,
					pollOptionId,
				},
			},
			create: {
				userId: dbUser.id,
				pollOptionId,
				value,
			},
			update: {
				value,
			},
		});

		return NextResponse.json(vote);
	} catch (error) {
		console.error('[POLL_VOTE] Error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
