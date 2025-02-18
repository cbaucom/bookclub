import { useQuery } from '@tanstack/react-query';
import type { GroupWithRole } from '@/types';
import { useAuth } from '@clerk/nextjs';

export function useGroups() {
	const { isLoaded, isSignedIn } = useAuth();

	return useQuery<GroupWithRole[], Error>({
		queryKey: ['groups', isSignedIn],
		queryFn: async () => {
			const url = '/api/groups/';
			console.log('[useGroups] Starting fetch from:', url);
			console.log('[useGroups] Auth state:', { isLoaded, isSignedIn });

			const response = await fetch(url);

			if (!response.ok) {
				const error = await response.json();
				console.error('[useGroups] API error:', {
					url,
					status: response.status,
					statusText: response.statusText,
					error
				});
				throw new Error(error.message || 'Failed to fetch groups');
			}

			const data = await response.json();
			console.log('[useGroups] Fetched groups:', {
				url,
				count: data.length,
				groups: data.map((g: GroupWithRole) => ({
					id: g.id,
					name: g.name,
					role: g.role,
					memberCount: g._count?.members
				}))
			});
			return data;
		},
		enabled: isLoaded && isSignedIn,
	});
}
