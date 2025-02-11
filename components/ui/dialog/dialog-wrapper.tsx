import { type ReactNode } from 'react';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';

interface DialogWrapperProps {
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  placement?: 'top' | 'bottom' | 'center' | undefined;
  role?: 'dialog' | 'alertdialog' | undefined;
  title: string;
}

export function DialogWrapper({
  children,
  footer,
  isOpen,
  onClose,
  placement = 'top',
  role = 'dialog',
  title,
}: DialogWrapperProps) {
  return (
    <DialogRoot
      motionPreset='slide-in-bottom'
      open={isOpen}
      onOpenChange={onClose}
      placement={placement}
      role={role}
    >
      <DialogBackdrop />
      <DialogContent mt={4} p={4}>
        <DialogHeader pb={4}>
          <DialogTitle fontSize='xl'>{title}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>{children}</DialogBody>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  );
}
