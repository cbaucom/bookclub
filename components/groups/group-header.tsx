import {
  Box,
  Editable,
  Flex,
  Heading,
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  Text,
} from '@chakra-ui/react';
import type { GroupWithRole } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGroupMutations } from '@/hooks/useGroupMutations';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import {
  FaCheck,
  FaPencilAlt,
  FaTrash,
  FaTimes,
  FaChevronLeft,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface GroupHeaderProps {
  group: GroupWithRole;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [descriptionValue, setDescriptionValue] = useState(
    group.description || ''
  );
  const { deleteMutation, updateMutation, leaveMutation } = useGroupMutations();

  // Don't show back button on the main group page
  const showBackButton = pathname !== `/groups/${group.id}`;

  // Update local state when group prop changes
  useEffect(() => {
    setNameValue(group.name);
    setDescriptionValue(group.description || '');
  }, [group.name, group.description]);

  const handleDelete = () => {
    deleteMutation.mutate(group.id, {
      onSuccess: () => {
        router.push('/groups');
      },
    });
  };

  const handleLeave = () => {
    leaveMutation.mutate(group.id, {
      onSuccess: () => {
        router.push('/groups');
      },
    });
  };

  const handleUpdate = (newValue: string, field: 'name' | 'description') => {
    if (newValue === (field === 'name' ? group.name : group.description))
      return;

    updateMutation.mutate(
      { id: group.id, [field]: newValue },
      {
        onSuccess: () => {
          // Success toast could be added here
        },
      }
    );
  };

  const isAdmin = group.role === 'ADMIN';
  const modalTitle = isAdmin ? 'Delete Group' : 'Leave Group';
  const modalAction = isAdmin ? handleDelete : handleLeave;
  const modalButtonText = isAdmin
    ? deleteMutation.isPending
      ? 'Deleting...'
      : 'Delete Group'
    : leaveMutation.isPending
      ? 'Leaving...'
      : 'Leave Group';
  const modalMessage = isAdmin
    ? `Are you sure you want to delete "${group.name}"? This action cannot be undone.`
    : `Are you sure you want to leave "${group.name}"? You'll need a new invitation to rejoin.`;

  return (
    <Box pb={4}>
      <Flex
        align={{ base: 'stretch', md: 'flex-start' }}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 4, md: 8 }}
      >
        <Box flex='1'>
          {/* Desktop back button */}
          <Flex
            align='center'
            gap={2}
            mb={2}
            display={{ base: 'none', md: 'flex' }}
          >
            {showBackButton && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <Box as={FaChevronLeft} mr={2} />
                Back to Group
              </Button>
            )}
          </Flex>

          <Editable.Root
            disabled={group.role !== 'ADMIN'}
            onValueChange={(details) => setNameValue(details.value)}
            onValueCommit={(details) => handleUpdate(details.value, 'name')}
            onValueRevert={() => setNameValue(group.name)}
            submitMode='none'
            value={nameValue}
          >
            <Flex align='center' gap={2}>
              <Editable.Preview>
                <Heading as='h1' size={{ base: 'xl', md: '2xl' }}>
                  {nameValue}
                </Heading>
              </Editable.Preview>
              <Editable.Input fontSize='16px' />
              {group.role === 'ADMIN' && (
                <Editable.Control>
                  <Editable.EditTrigger asChild>
                    <Button
                      aria-label='Edit group name'
                      size='sm'
                      variant='ghost'
                    >
                      <FaPencilAlt />
                    </Button>
                  </Editable.EditTrigger>
                  <Editable.CancelTrigger asChild>
                    <Button aria-label='Cancel edit' size='sm' variant='ghost'>
                      <FaTimes />
                    </Button>
                  </Editable.CancelTrigger>
                  <Editable.SubmitTrigger asChild>
                    <Button
                      aria-label='Save changes'
                      size='sm'
                      variant='ghost'
                      colorPalette='green'
                    >
                      <FaCheck />
                    </Button>
                  </Editable.SubmitTrigger>
                </Editable.Control>
              )}
            </Flex>
          </Editable.Root>

          {group.description !== null ? (
            <Editable.Root
              value={descriptionValue}
              onValueChange={(details) => setDescriptionValue(details.value)}
              onValueCommit={(details) =>
                handleUpdate(details.value, 'description')
              }
              onValueRevert={() => setDescriptionValue(group.description || '')}
              submitMode='none'
              disabled={group.role !== 'ADMIN'}
            >
              <Flex align='center' gap={2}>
                <Editable.Preview>
                  <Text fontSize='md' color='fg.muted'>
                    {descriptionValue}
                  </Text>
                </Editable.Preview>
                <Editable.Input fontSize='16px' />
                {group.role === 'ADMIN' && (
                  <Editable.Control>
                    <Editable.EditTrigger asChild>
                      <Button
                        aria-label='Edit description'
                        size='sm'
                        variant='ghost'
                      >
                        <FaPencilAlt />
                      </Button>
                    </Editable.EditTrigger>
                    <Editable.CancelTrigger asChild>
                      <Button
                        aria-label='Cancel edit'
                        size='sm'
                        variant='ghost'
                      >
                        <FaTimes />
                      </Button>
                    </Editable.CancelTrigger>
                    <Editable.SubmitTrigger asChild>
                      <Button
                        aria-label='Save changes'
                        size='sm'
                        variant='ghost'
                        colorPalette='green'
                      >
                        <FaCheck />
                      </Button>
                    </Editable.SubmitTrigger>
                  </Editable.Control>
                )}
              </Flex>
            </Editable.Root>
          ) : null}
        </Box>

        <Box w={{ base: 'full', md: '100px' }} position='relative'>
          <PopoverRoot>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                w={{ base: 'full', md: 'auto' }}
              >
                Actions
              </Button>
            </PopoverTrigger>
            <PopoverContent
              zIndex={1000}
              position='absolute'
              w={{ base: 'full', md: '200px' }}
              mt={1}
              transform={{
                base: 'none',
                md: 'translateX(-100%) translateX(100px)',
              }}
            >
              <Button
                w='full'
                variant='ghost'
                color='fg.error'
                _hover={{ bg: 'bg.error', color: 'fg.error' }}
                onClick={() => setIsModalOpen(true)}
              >
                <Flex align='center' gap={2}>
                  <FaTrash />
                  {isAdmin ? 'Delete Group' : 'Leave Group'}
                </Flex>
              </Button>
            </PopoverContent>
          </PopoverRoot>
        </Box>
      </Flex>

      {/* Mobile back button */}
      {showBackButton && (
        <Box mt={4} display={{ base: 'block', md: 'none' }}>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push(`/groups/${group.id}`)}
          >
            <Box as={FaChevronLeft} mr={2} />
            Back to Group
          </Button>
        </Box>
      )}
      <DialogWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        footer={
          <Flex gap={3} justify='flex-end'>
            <Button onClick={() => setIsModalOpen(false)} colorPalette='gray'>
              Cancel
            </Button>
            <Button
              onClick={modalAction}
              colorPalette='red'
              disabled={deleteMutation.isPending || leaveMutation.isPending}
            >
              {modalButtonText}
            </Button>
          </Flex>
        }
      >
        <Text fontSize='md' my={4}>
          {modalMessage}
        </Text>
      </DialogWrapper>
    </Box>
  );
}
