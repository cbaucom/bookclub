import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Membership } from '@prisma/client';
import { BASE_URL } from '@/lib/constants';

export interface MembershipWithUser extends Membership {
	user: {
		id: string;
		clerkId: string;
		firstName: string | null;
		lastName: string | null;
		email: string;
		imageUrl: string | null;
	};
}

async function fetchMembers(groupId: string): Promise<MembershipWithUser[]> {
	const response = await fetch(`${BASE_URL}/api/groups/${groupId}/members`);
	if (!response.ok) {
		throw new Error('Failed to fetch members');
	}
	return response.json();
}

export function useIsAdmin(groupId: string) {
	const { userId } = useAuth();
	const { data: members, isLoading } = useQuery({
		queryKey: ['members', groupId],
		queryFn: () => fetchMembers(groupId),
	});

	const isAdmin = members?.some(
		(member) => member.user.clerkId === userId && member.role === 'ADMIN'
	);

	return {
		isAdmin,
		isLoading,
		members,
	};
}