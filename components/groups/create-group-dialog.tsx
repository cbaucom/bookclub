import { type FormEvent, type ReactElement } from 'react';
import { useState } from 'react';
import { Box, Flex, Input, Text } from '@chakra-ui/react';
import { Button } from '../ui/button';
import { DialogWrapper } from '../ui/dialog/dialog-wrapper';
import { Privacy } from '@prisma/client';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (group: {
    name: string;
    description: string;
    privacy: Privacy;
  }) => void;
  isLoading?: boolean;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateGroupDialogProps): ReactElement {
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    privacy: 'PUBLIC' as Privacy,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(newGroup);
    setNewGroup({
      name: '',
      description: '',
      privacy: 'PUBLIC' as Privacy,
    });
  };

  const footer = (
    <Flex gap={3} pt={4}>
      <Button variant='ghost' onClick={onClose}>
        Cancel
      </Button>
      <Button
        colorPalette='purple'
        type='submit'
        form='create-group-form'
        loading={isLoading}
      >
        Create Group
      </Button>
    </Flex>
  );

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title='Create a new group'
      footer={footer}
    >
      <form id='create-group-form' onSubmit={handleSubmit}>
        <Flex direction='column' gap={4}>
          <Box>
            <Text mb={2}>Group Name</Text>
            <Input
              name='name'
              onChange={(e) =>
                setNewGroup({ ...newGroup, name: e.target.value })
              }
              padding='4'
              placeholder='Enter group name'
              required
              size='lg'
              value={newGroup.name}
            />
          </Box>

          <Box>
            <Text mb={2}>Description</Text>
            <Input
              name='description'
              onChange={(e) =>
                setNewGroup({ ...newGroup, description: e.target.value })
              }
              padding='4'
              placeholder='Enter group description'
              size='lg'
              value={newGroup.description}
            />
          </Box>

          <Box>
            <Text mb={2}>Privacy</Text>
            <select
              name='privacy'
              onChange={(e) =>
                setNewGroup({
                  ...newGroup,
                  privacy: e.target.value as Privacy,
                })
              }
              style={{
                padding: '0.5rem',
                width: '100%',
                borderWidth: '1px',
                borderRadius: '0.375rem',
              }}
              value={newGroup.privacy}
            >
              <option value='PUBLIC'>Public</option>
              <option value='PRIVATE'>Private</option>
            </select>
          </Box>
        </Flex>
      </form>
    </DialogWrapper>
  );
}
