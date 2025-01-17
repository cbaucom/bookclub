import { type ReactElement } from 'react';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
} from '@/components/ui/dialog';

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
    <DialogRoot
      motionPreset='slide-in-bottom'
      open={isOpen}
      onOpenChange={onClose}
      placement='top'
    >
      <DialogBackdrop />
      <DialogContent mt={4} p={4}>
        <DialogHeader pb={4}>{title}</DialogHeader>

        <DialogCloseTrigger />
        <DialogBody>
          <DialogDescription className='mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap'>
            {description}
          </DialogDescription>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
