import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from './prisma';
import { MemberRole } from '@prisma/client';

export async function getAuthenticatedUser() {
	try {
		const { userId } = await auth();

		if (!userId) {
			console.log('[AUTH] No userId found');
			return null;
		}

		const clerkUser = await currentUser();
		if (!clerkUser) {
			console.log('[AUTH] No Clerk user found');
			return null;
		}

		const email = clerkUser.emailAddresses[0]?.emailAddress;
		if (!email) {
			console.log('[AUTH] No email found for user');
			return null;
		}

		// First try to find user by clerkId
		let dbUser = await prisma.user.findUnique({
			where: { clerkId: userId },
		});

		// If no user found by clerkId, try to find by email
		if (!dbUser) {
			dbUser = await prisma.user.findUnique({
				where: { email },
			});

			// If user exists with email but different clerkId, update the clerkId
			if (dbUser) {
				console.log('[AUTH] Updating existing user with new clerkId');
				dbUser = await prisma.user.update({
					where: { email },
					data: {
						clerkId: userId,
						firstName: clerkUser.firstName ?? '',
						lastName: clerkUser.lastName ?? '',
					},
				});
			} else {
				// Create new user if neither clerkId nor email exists
				console.log('[AUTH] Creating new user in database');
				dbUser = await prisma.user.create({
					data: {
						clerkId: userId,
						email,
						firstName: clerkUser.firstName ?? '',
						lastName: clerkUser.lastName ?? '',
					},
				});
			}
		} else {
			// Update user information from Clerk if found by clerkId
			console.log('[AUTH] Updating existing user info');
			dbUser = await prisma.user.update({
				where: { clerkId: userId },
				data: {
					email,
					firstName: clerkUser.firstName ?? '',
					lastName: clerkUser.lastName ?? '',
				},
			});
		}

		return dbUser;
	} catch (error) {
		console.error('[AUTH] Error in getAuthenticatedUser:', error instanceof Error ? error.message : 'Unknown error');
		return null;
	}
}

export async function checkGroupMembership(userId: string, groupId: string) {
	const membership = await prisma.membership.findFirst({
		where: {
			userId,
			groupId,
		},
	});

	return membership;
}

export async function checkGroupAdmin(userId: string, groupId: string) {
	const membership = await prisma.membership.findFirst({
		where: {
			userId,
			groupId,
			role: 'ADMIN',
		},
	});

	return membership;
}

export async function isMemberOfGroup(
	userId: string,
	groupId: string,
	role?: MemberRole
): Promise<boolean> {
	const membership = await prisma.membership.findFirst({
		where: {
			userId,
			groupId,
			...(role ? { role } : {}),
		},
	});

	return !!membership;
}