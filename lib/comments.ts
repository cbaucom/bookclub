import prisma from '@/lib/prisma';
import type { CommentWithUser } from '@/types';

export async function fetchCommentReplies(commentId: string): Promise<CommentWithUser[]> {
	const replies = await prisma.comment.findMany({
		where: {
			parentId: commentId,
		},
		orderBy: {
			createdAt: 'asc',
		},
		include: {
			user: {
				select: {
					clerkId: true,
					firstName: true,
					imageUrl: true,
					lastName: true,
				},
			},
			reactions: {
				include: {
					user: {
						select: {
							clerkId: true,
							firstName: true,
							imageUrl: true,
							lastName: true,
						},
					},
				},
			},
		},
	});

	// Recursively fetch replies for each comment
	const repliesWithNested = await Promise.all(
		replies.map(async (reply) => {
			const nestedReplies = await fetchCommentReplies(reply.id);
			return {
				...reply,
				replies: nestedReplies,
			};
		})
	);

	return repliesWithNested;
}