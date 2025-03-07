import { ButtonGroup } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { toaster } from '@/components/ui/toaster';
import { useMeetingMutations } from '@/hooks/useMeetingMutations';
import { useState } from 'react';

interface RSVPButtonsProps {
  meetingId: string;
  groupId: string;
  currentStatus?: 'YES' | 'NO' | 'MAYBE';
}

export function RSVPButtons({
  meetingId,
  groupId,
  currentStatus,
}: RSVPButtonsProps) {
  const [selectedStatus, setSelectedStatus] = useState<
    'YES' | 'NO' | 'MAYBE' | undefined
  >(currentStatus);
  const { respondMutation } = useMeetingMutations(groupId);

  const handleRSVP = (status: 'YES' | 'NO' | 'MAYBE') => {
    // Store previous status in case we need to revert
    const previousStatus = selectedStatus;

    // Optimistically update UI
    setSelectedStatus(status);

    respondMutation.mutate(
      {
        meetingId,
        status,
      },
      {
        onError: () => {
          // Revert to previous status on error
          setSelectedStatus(previousStatus);
          toaster.create({
            title: 'Failed to update RSVP',
            description: 'Please try again.',
            type: 'error',
            duration: 3000,
          });
        },
      }
    );
  };

  return (
    <ButtonGroup size='sm' variant='outline'>
      <Button
        colorPalette={selectedStatus === 'YES' ? 'green' : 'gray'}
        onClick={() => handleRSVP('YES')}
        fontWeight={selectedStatus === 'YES' ? 'bold' : 'normal'}
        loading={respondMutation.isPending}
      >
        Yes
      </Button>
      <Button
        colorPalette={selectedStatus === 'NO' ? 'red' : 'gray'}
        onClick={() => handleRSVP('NO')}
        fontWeight={selectedStatus === 'NO' ? 'bold' : 'normal'}
        loading={respondMutation.isPending}
      >
        No
      </Button>
      <Button
        colorPalette={selectedStatus === 'MAYBE' ? 'orange' : 'gray'}
        onClick={() => handleRSVP('MAYBE')}
        fontWeight={selectedStatus === 'MAYBE' ? 'bold' : 'normal'}
        loading={respondMutation.isPending}
      >
        Maybe
      </Button>
    </ButtonGroup>
  );
}
