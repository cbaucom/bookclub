import { useQuery } from '@tanstack/react-query';
import { GroupWithMeeting, MeetingWithResponses } from '@/types';
import { useAuth } from '@clerk/nextjs';

export function useGroups() {
	const { isLoaded, isSignedIn } = useAuth();

	return useQuery<GroupWithMeeting[]>({
		queryKey: ['groups'],
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
				groups: data.map((g: GroupWithMeeting) => ({
					id: g.id,
					name: g.name,
					role: g.role,
					memberCount: g._count?.members
				}))
			});

			// Fetch upcoming meetings for each group
			const groupsWithMeetings = await Promise.all(
				data.map(async (group: GroupWithMeeting) => {
					try {
						const meetingsResponse = await fetch(`/api/groups/${group.id}/meetings`);
						if (meetingsResponse.ok) {
							const meetings = await meetingsResponse.json();

							// Filter for future meetings and sort by date
							const futureMeetings = meetings.filter(
								(meeting: MeetingWithResponses) => new Date(meeting.date) > new Date()
							);

							futureMeetings.sort(
								(a: MeetingWithResponses, b: MeetingWithResponses) =>
									new Date(a.date).getTime() - new Date(b.date).getTime()
							);

							// Add the closest upcoming meeting if any
							if (futureMeetings.length > 0) {
								return {
									...group,
									upcomingMeeting: futureMeetings[0]
								};
							}
						}
					} catch (error) {
						console.error(`Error fetching meetings for group ${group.id}:`, error);
					}

					return {
						...group,
						upcomingMeeting: null
					};
				})
			);

			return groupsWithMeetings;
		},
		enabled: isLoaded && isSignedIn,
	});
}
