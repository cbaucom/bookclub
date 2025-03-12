import {
  Box,
  Button,
  Field,
  Flex,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useState } from 'react';
import {
  CreateMeetingRequest,
  MeetingWithResponses,
  UpdateMeetingRequest,
} from '@/types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface MeetingFormProps {
  groupId: string;
  onSubmit: (data: CreateMeetingRequest | UpdateMeetingRequest) => void;
  isLoading: boolean;
  meeting?: MeetingWithResponses;
  onCancel: () => void;
}

export function MeetingForm({
  groupId,
  onSubmit,
  isLoading,
  meeting,
  onCancel,
}: MeetingFormProps) {
  const isEditing = !!meeting;

  // Format date for input if editing
  const formatDateForInput = (dateString: string) => {
    // When editing, we need to convert the UTC date to local time
    // for the datetime-local input
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = toZonedTime(new Date(dateString), userTimeZone);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const [formData, setFormData] = useState<CreateMeetingRequest>({
    title: meeting?.title || '',
    description: meeting?.description || '',
    location: meeting?.location || '',
    address: meeting?.address || '',
    date: meeting ? formatDateForInput(meeting.date as unknown as string) : '',
    groupId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date and time are required';
    } else if (isNaN(Date.parse(formData.date))) {
      newErrors.date = 'Invalid date format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Box as='form' onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Box>
          <Field.Root disabled={!!errors.title}>
            <Field.Label>Title</Field.Label>
            <Input
              id='title'
              name='title'
              value={formData.title}
              onChange={handleChange}
              placeholder='Meeting title'
              borderColor={errors.title ? 'red.500' : undefined}
            />
          </Field.Root>
          {errors.title && (
            <Text color='red.500' fontSize='sm' mt={1}>
              {errors.title}
            </Text>
          )}
        </Box>

        <Box>
          <Field.Root disabled={!!errors.description}>
            <Field.Label>Description (optional)</Field.Label>
            <Textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              placeholder='Meeting description'
              rows={3}
              borderColor={errors.description ? 'red.500' : undefined}
            />
          </Field.Root>
          {errors.description && (
            <Text color='red.500' fontSize='sm' mt={1}>
              {errors.description}
            </Text>
          )}
        </Box>

        <Box>
          <Field.Root disabled={!!errors.location}>
            <Field.Label>Location (optional)</Field.Label>
            <Input
              id='location'
              name='location'
              value={formData.location}
              onChange={handleChange}
              placeholder='Location name (e.g. Coffee Shop)'
              borderColor={errors.location ? 'red.500' : undefined}
            />
          </Field.Root>
          {errors.location && (
            <Text color='red.500' fontSize='sm' mt={1}>
              {errors.location}
            </Text>
          )}
        </Box>

        <Box>
          <Field.Root disabled={!!errors.address}>
            <Field.Label>Address (optional)</Field.Label>
            <Input
              id='address'
              name='address'
              value={formData.address}
              onChange={handleChange}
              placeholder='Full address for Google Maps'
              borderColor={errors.address ? 'red.500' : undefined}
            />
          </Field.Root>
          {errors.address && (
            <Text color='red.500' fontSize='sm' mt={1}>
              {errors.address}
            </Text>
          )}
        </Box>

        <Box>
          <Field.Root disabled={!!errors.date}>
            <Field.Label>Date and Time</Field.Label>
            <Input
              id='date'
              name='date'
              type='datetime-local'
              value={formData.date}
              onChange={handleChange}
              borderColor={errors.date ? 'red.500' : undefined}
            />
          </Field.Root>
          {errors.date && (
            <Text color='red.500' fontSize='sm' mt={1}>
              {errors.date}
            </Text>
          )}
        </Box>

        <Flex justify='space-between' gap={3} mt={4}>
          <Button onClick={onCancel} variant='ghost'>
            Cancel
          </Button>
          <Button
            type='submit'
            colorPalette='purple'
            loading={isLoading}
            loadingText={isEditing ? 'Updating...' : 'Creating...'}
          >
            {isEditing ? 'Update Meeting' : 'Create Meeting'}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
