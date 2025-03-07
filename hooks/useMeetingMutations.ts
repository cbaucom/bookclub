import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMeetingRequest, MeetingResponseRequest, UpdateMeetingRequest } from '@/types';

export function useMeetingMutations(groupId: string) {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (data: CreateMeetingRequest) => {
			const response = await fetch(`/api/groups/${groupId}/meetings`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create meeting');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
			queryClient.invalidateQueries({ queryKey: ['upcomingMeeting', groupId] });
			queryClient.invalidateQueries({ queryKey: ['groups'] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({ meetingId, ...data }: UpdateMeetingRequest & { meetingId: string }) => {
			const response = await fetch(`/api/groups/${groupId}/meetings/${meetingId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update meeting');
			}

			return response.json();
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
			queryClient.invalidateQueries({ queryKey: ['meetings', groupId, variables.meetingId] });
			queryClient.invalidateQueries({ queryKey: ['upcomingMeeting', groupId] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (meetingId: string) => {
			const response = await fetch(`/api/groups/${groupId}/meetings/${meetingId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete meeting');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
			queryClient.invalidateQueries({ queryKey: ['upcomingMeeting', groupId] });
		},
	});

	const respondMutation = useMutation({
		mutationFn: async ({ meetingId, status }: { meetingId: string; status: MeetingResponseRequest['status'] }) => {
			const response = await fetch(`/api/groups/${groupId}/meetings/${meetingId}/respond`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to respond to meeting');
			}

			return response.json();
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
			queryClient.invalidateQueries({ queryKey: ['meetings', groupId, variables.meetingId] });
			queryClient.invalidateQueries({ queryKey: ['upcomingMeeting', groupId] });
		},
	});

	return {
		createMutation,
		updateMutation,
		deleteMutation,
		respondMutation,
	};
}