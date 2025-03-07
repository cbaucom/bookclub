import { useQuery } from '@tanstack/react-query';
import { MeetingWithResponses } from '@/types';

export function useMeetings(groupId: string) {
	return useQuery<MeetingWithResponses[]>({
		queryKey: ['meetings', groupId],
		queryFn: async () => {
			const response = await fetch(`/api/groups/${groupId}/meetings`);
			if (!response.ok) {
				throw new Error('Failed to fetch meetings');
			}
			return response.json();
		},
		enabled: !!groupId,
	});
}

export function useMeeting(groupId: string, meetingId: string) {
	return useQuery<MeetingWithResponses>({
		queryKey: ['meetings', groupId, meetingId],
		queryFn: async () => {
			const response = await fetch(
				`/api/groups/${groupId}/meetings/${meetingId}`
			);
			if (!response.ok) {
				throw new Error('Failed to fetch meeting');
			}
			return response.json();
		},
		enabled: !!groupId && !!meetingId,
	});
}

export function useUpcomingMeeting(groupId: string) {
	return useQuery<MeetingWithResponses | null>({
		queryKey: ['upcomingMeeting', groupId],
		queryFn: async () => {
			const response = await fetch(`/api/groups/${groupId}/meetings`);
			if (!response.ok) {
				throw new Error('Failed to fetch meetings');
			}
			const data = await response.json();

			// Filter meetings that are in the future
			const futureMeetings = data.filter(
				(meeting: MeetingWithResponses) => new Date(meeting.date) > new Date()
			);

			// Sort by date (closest first)
			futureMeetings.sort(
				(a: MeetingWithResponses, b: MeetingWithResponses) =>
					new Date(a.date).getTime() - new Date(b.date).getTime()
			);

			// Return the closest upcoming meeting or null if none
			return futureMeetings.length > 0 ? futureMeetings[0] : null;
		},
		enabled: !!groupId,
	});
}