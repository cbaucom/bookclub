import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { GroupWithRole } from '@/types';

async function fetchGroup(groupId: string): Promise<GroupWithRole> {
	const response = await fetch(`/api/groups/${groupId}`);
	if (!response.ok) {
		throw new Error('Failed to fetch group');
	}
	return response.json();
}

export function useGroup(groupId: string) {
	const { isLoaded, isSignedIn } = useAuth();

	return useQuery<GroupWithRole, Error>({
		queryKey: ['group', groupId, isSignedIn],
		queryFn: () => fetchGroup(groupId),
		enabled: isLoaded && isSignedIn,
	});
}