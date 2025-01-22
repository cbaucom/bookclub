import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';
import { Flex, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';

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

  const footer = (
    <>
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
    </>
  );

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title='Invite Member'
      footer={footer}
    >
      <Flex as='form' flexDirection='column' gap={4} onSubmit={handleSubmit}>
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
      </Flex>
    </DialogWrapper>
  );
}
