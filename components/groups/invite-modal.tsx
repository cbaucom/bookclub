import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@/components/ui/toaster';
import { Flex, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { isValidEmail } from '@/lib/utils';

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
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      onClose();
      setEmail('');
      setError('');
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    inviteMutation.mutate();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title='Invite Member'>
      <Flex direction='column' gap={4}>
        <Field label='Email address' invalid={!!error} helperText={error}>
          <Input
            padding={2}
            type='email'
            value={email}
            onChange={handleEmailChange}
            placeholder='Enter email address'
            aria-invalid={!!error}
          />
        </Field>
        <Flex justify='flex-end' gap={3} mt={4}>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette='blue'
            onClick={handleSubmit}
            loading={inviteMutation.isPending}
          >
            Send Invitation
          </Button>
        </Flex>
      </Flex>
    </DialogWrapper>
  );
}
