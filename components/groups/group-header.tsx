import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import type { GroupWithRole } from '@/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGroupMutations } from '@/hooks/useGroupMutations';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { FaTrash } from 'react-icons/fa';

interface GroupHeaderProps {
  group: GroupWithRole;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteMutation } = useGroupMutations();

  const handleDelete = () => {
    deleteMutation.mutate(group.id, {
      onSuccess: () => {
        router.push('/groups');
      },
    });
  };

  return (
    <Box pb={4}>
      <Flex justify='space-between' align='flex-start' gap={4}>
        <Box>
          <Heading as='h1' size='2xl'>
            {group.name}
          </Heading>
          {group.description && (
            <Text mt={4} fontSize='md' color='fg.muted'>
              {group.description}
            </Text>
          )}
        </Box>
        {group.role === 'ADMIN' && (
          <Flex gap={2} align='center'>
            <Button
              colorPalette='red'
              gap={2}
              onClick={() => setIsDeleteDialogOpen(true)}
              size='xs'
            >
              <FaTrash />
              Delete Group
            </Button>
          </Flex>
        )}
      </Flex>

      <DialogWrapper
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title='Delete Group'
        footer={
          <Flex gap={3} justify='flex-end'>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              colorPalette='gray'
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              colorPalette='red'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Group'}
            </Button>
          </Flex>
        }
      >
        <Text fontSize='md' my={4}>
          Are you sure you want to delete &quot;{group.name}&quot;? This action
          cannot be undone.
        </Text>
      </DialogWrapper>
    </Box>
  );
}
