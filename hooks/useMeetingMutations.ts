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

			const data = await response.json();
			return data;
		},
		onMutate: async ({ meetingId }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['meetings', groupId] });
			await queryClient.cancelQueries({ queryKey: ['meetings', groupId, meetingId] });
			await queryClient.cancelQueries({ queryKey: ['upcomingMeeting', groupId] });

			// Snapshot the previous value
			const previousMeeting = queryClient.getQueryData(['meetings', groupId, meetingId]);

			return { previousMeeting };
		},
		onError: (err, variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousMeeting) {
				queryClient.setQueryData(['meetings', groupId, variables.meetingId], context.previousMeeting);
			}
		},
		onSettled: (_, __, variables) => {
			// Always refetch after error or success to ensure we have the latest data
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