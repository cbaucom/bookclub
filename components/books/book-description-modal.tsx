import { type ReactElement } from 'react';
import { DialogDescription } from '@/components/ui/dialog';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { Button } from '@/components/ui/button';

interface BookDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function BookDescriptionModal({
  isOpen,
  onClose,
  title,
  description,
}: BookDescriptionModalProps): ReactElement {
  return (
    <DialogWrapper
      footer={
        <Button variant='ghost' onClick={onClose}>
          Close
        </Button>
      }
      isOpen={isOpen}
      onClose={onClose}
      placement='center'
      title={title}
    >
      <DialogDescription py={2}>{description}</DialogDescription>
    </DialogWrapper>
  );
}
