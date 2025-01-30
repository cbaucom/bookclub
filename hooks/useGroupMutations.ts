import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Group } from '@prisma/client';
import type { GroupWithRole } from '@/types';

export function useGroupMutations() {
	const queryClient = useQueryClient();

	const createMutation = useMutation<GroupWithRole, Error, Partial<Group>>({
		mutationFn: async (newGroup) => {
			const response = await fetch('/api/groups', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newGroup),
			});

			if (!response.ok) {
				throw new Error('Failed to create group');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['groups'] });
		},
	});

	const deleteMutation = useMutation<void, Error, string>({
		mutationFn: async (groupId) => {
			const response = await fetch(`/api/groups/${groupId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete group');
			}
		},
		onSuccess: (_, groupId) => {
			// Invalidate the groups list
			queryClient.invalidateQueries({ queryKey: ['groups'] });
			// Invalidate the specific group
			queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
		},
	});

	const updateMutation = useMutation<GroupWithRole, Error, Partial<Group>>({
		mutationFn: async (updatedGroup) => {
			const response = await fetch(`/api/groups/${updatedGroup.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedGroup),
			});

			if (!response.ok) {
				throw new Error('Failed to update group');
			}

			return response.json();
		},
		onSuccess: (data, updatedGroup) => {
			// Update the group in the cache
			queryClient.setQueryData(['group', updatedGroup.id], data);
			// Also invalidate the groups list
			queryClient.invalidateQueries({ queryKey: ['groups'] });
		},
	});

	const leaveMutation = useMutation<void, Error, string>({
		mutationFn: async (groupId) => {
			const response = await fetch(`/api/groups/${groupId}/leave`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to leave group');
			}
		},
		onSuccess: (_, groupId) => {
			// Invalidate the groups list
			queryClient.invalidateQueries({ queryKey: ['groups'] });
			// Invalidate the specific group
			queryClient.invalidateQueries({ queryKey: ['group', groupId] });
		},
	});

	return {
		createMutation,
		deleteMutation,
		updateMutation,
		leaveMutation,
	};
}
