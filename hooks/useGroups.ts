import { useQuery } from '@tanstack/react-query';
import type { GroupWithRole } from '@/types';
import { useAuth } from '@clerk/nextjs';

export function useGroups() {
	const { isLoaded, isSignedIn } = useAuth();

	return useQuery<GroupWithRole[], Error>({
		queryKey: ['groups', isSignedIn],
		queryFn: async () => {
			const response = await fetch('/api/groups');
			if (!response.ok) {
				throw new Error('Failed to fetch groups');
			}
			return response.json();
		},
		enabled: isLoaded && isSignedIn,
	});
}
