import { ButtonGroup } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
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
    setSelectedStatus(status);
    respondMutation.mutate({
      meetingId,
      status,
    });
  };

  return (
    <ButtonGroup size='sm' variant='outline'>
      <Button
        colorPalette={selectedStatus === 'YES' ? 'green' : 'gray'}
        onClick={() => handleRSVP('YES')}
        fontWeight={selectedStatus === 'YES' ? 'bold' : 'normal'}
      >
        Yes
      </Button>
      <Button
        colorPalette={selectedStatus === 'NO' ? 'red' : 'gray'}
        onClick={() => handleRSVP('NO')}
        fontWeight={selectedStatus === 'NO' ? 'bold' : 'normal'}
      >
        No
      </Button>
      <Button
        colorPalette={selectedStatus === 'MAYBE' ? 'orange' : 'gray'}
        onClick={() => handleRSVP('MAYBE')}
        fontWeight={selectedStatus === 'MAYBE' ? 'bold' : 'normal'}
      >
        Maybe
      </Button>
    </ButtonGroup>
  );
}
