import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from './prisma';

export async function getAuthenticatedUser() {
	const { userId } = await auth();

	if (!userId) {
		return null;
	}

	const clerkUser = await currentUser();
	if (!clerkUser) {
		return null;
	}

	// Find or create user in database
	let dbUser = await prisma.user.findUnique({
		where: { clerkId: userId },
	});

	if (!dbUser) {
		dbUser = await prisma.user.create({
			data: {
				clerkId: userId,
				email: clerkUser.emailAddresses[0].emailAddress,
				firstName: clerkUser.firstName ?? '',
				lastName: clerkUser.lastName ?? '',
			},
		});
	} else {
		// Update user information from Clerk
		dbUser = await prisma.user.update({
			where: { clerkId: userId },
			data: {
				email: clerkUser.emailAddresses[0].emailAddress,
				firstName: clerkUser.firstName ?? '',
				lastName: clerkUser.lastName ?? '',
			},
		});
	}

	return dbUser;
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