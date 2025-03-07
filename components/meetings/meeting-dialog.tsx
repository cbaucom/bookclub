import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { MeetingForm } from './meeting-form';
import {
  MeetingWithResponses,
  CreateMeetingRequest,
  UpdateMeetingRequest,
} from '@/types';
import { useMeetingMutations } from '@/hooks/useMeetingMutations';

interface MeetingDialogProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  meeting?: MeetingWithResponses;
}

export function MeetingDialog({
  groupId,
  isOpen,
  onClose,
  meeting,
}: MeetingDialogProps) {
  const isEditing = !!meeting;
  const { createMutation, updateMutation } = useMeetingMutations(groupId);

  const handleSubmit = (data: CreateMeetingRequest | UpdateMeetingRequest) => {
    if (isEditing && meeting) {
      updateMutation.mutate(
        { meetingId: meeting.id, ...(data as UpdateMeetingRequest) },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(data as CreateMeetingRequest, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Meeting' : 'Create Meeting'}
    >
      <MeetingForm
        groupId={groupId}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        meeting={meeting}
        onCancel={onClose}
      />
    </DialogWrapper>
  );
}
