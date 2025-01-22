import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';
import { DialogBackdrop, Flex, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';

interface InviteModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

async function inviteMember(groupId: string, email: string) {
  const response = await fetch(`/api/groups/${groupId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite member');
  }

  return response.json();
}

export function InviteModal({ groupId, isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      onClose();
      setEmail('');
      toaster.create({
        title: 'Invitation sent',
        description: 'An invitation has been sent to ' + email,
        type: 'success',
        duration: 5000,
      });
    },
    onError: (error) => {
      toaster.create({
        title: 'Failed to send invitation',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate();
  };

  return (
    <DialogRoot
      motionPreset='slide-in-bottom'
      open={isOpen}
      onOpenChange={onClose}
      placement='center'
    >
      <DialogBackdrop />
      <DialogContent mt={4} p={4}>
        <Flex
          as='form'
          flexDirection='column'
          gap={4}
          onSubmit={handleSubmit}
          p={4}
        >
          <DialogHeader>
            <DialogTitle pb={4} fontSize='xl'>
              Invite Member
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Field label='Email address' invalid={false}>
              <Input
                padding={2}
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter email address'
                required
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette='blue'
              type='submit'
              loading={inviteMutation.isPending}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </Flex>
      </DialogContent>
    </DialogRoot>
  );
}
