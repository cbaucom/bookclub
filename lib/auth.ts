import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from './prisma';
import { MemberRole } from '@prisma/client';

export async function getAuthenticatedUser() {
	try {
		console.log('[AUTH] Starting getAuthenticatedUser');
		const { userId } = await auth();
		console.log('[AUTH] Clerk userId:', userId);

		if (!userId) {
			console.log('[AUTH] No userId found');
			return null;
		}

		const clerkUser = await currentUser();
		console.log('[AUTH] Clerk user:', {
			id: clerkUser?.id,
			hasEmail: !!clerkUser?.emailAddresses?.length,
			username: clerkUser?.username
		});

		if (!clerkUser) {
			console.log('[AUTH] No Clerk user found');
			return null;
		}

		const email = clerkUser.emailAddresses[0]?.emailAddress;
		console.log('[AUTH] User email:', email);

		if (!email) {
			console.log('[AUTH] No email found for user');
			return null;
		}

		// First try to find user by clerkId
		let dbUser = await prisma.user.findUnique({
			where: { clerkId: userId },
		});

		console.log('[AUTH] DB user by clerkId:', {
			found: !!dbUser,
			id: dbUser?.id,
			email: dbUser?.email,
			username: dbUser?.username
		});

		// If no user found by clerkId, try to find by email
		if (!dbUser) {
			dbUser = await prisma.user.findUnique({
				where: { email },
			});

			console.log('[AUTH] DB user by email:', {
				found: !!dbUser,
				id: dbUser?.id,
				email: dbUser?.email,
				username: dbUser?.username
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
						imageUrl: clerkUser.imageUrl,
						username: clerkUser.username,
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
						imageUrl: clerkUser.imageUrl,
						username: clerkUser.username,
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
					imageUrl: clerkUser.imageUrl,
					username: clerkUser.username,
				},
			});
		}

		console.log('[AUTH] Final DB user:', {
			id: dbUser.id,
			email: dbUser.email,
			clerkId: dbUser.clerkId,
			username: dbUser.username
		});

		return dbUser;
	} catch (error) {
		console.error('[AUTH] Error in getAuthenticatedUser:', error instanceof Error ? error.message : 'Unknown error');
		console.error('[AUTH] Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			stack: error instanceof Error ? error.stack : undefined,
		});
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