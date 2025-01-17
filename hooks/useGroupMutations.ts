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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['groups'] });
		},
	});

	return {
		createMutation,
		deleteMutation,
	};
}
