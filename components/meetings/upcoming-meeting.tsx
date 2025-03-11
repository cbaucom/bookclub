import { Box, Flex, Heading, Link as ChakraLink, Text } from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
import { formatInTimeZone } from 'date-fns-tz';
import {
  FaCalendar,
  FaMapMarkerAlt,
  FaPencilAlt,
  FaTrash,
} from 'react-icons/fa';
import { MeetingWithResponses, MeetingResponseWithUser } from '@/types';
import { RSVPButtons } from './rsvp-buttons';
import { useAuth } from '@clerk/nextjs';
import { useGroup } from '@/hooks/useGroup';
import { Button } from '../ui/button';
import { useUpcomingMeeting } from '@/hooks/useMeetings';
import { useState } from 'react';
import { MeetingDialog } from './meeting-dialog';
import { useMeetingMutations } from '@/hooks/useMeetingMutations';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';

interface UpcomingMeetingProps {
  meeting: MeetingWithResponses;
  groupId: string;
}

export function UpcomingMeeting({ meeting, groupId }: UpcomingMeetingProps) {
  const { userId } = useAuth();
  const { data: group } = useGroup(groupId as string);
  const { data: upcomingMeeting } = useUpcomingMeeting(groupId as string);
  const [editMeeting, setEditMeeting] = useState<
    MeetingWithResponses | undefined
  >(undefined);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const { deleteMutation } = useMeetingMutations(groupId);

  const isAdmin = group?.role === 'ADMIN';

  // Create Google Maps link if address is available
  const googleMapsLink = meeting.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        meeting.address
      )}`
    : null;

  // Format date and time
  const formattedDate = formatInTimeZone(
    new Date(meeting.date),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    'EEEE, MMMM d, yyyy'
  );
  const formattedTime = formatInTimeZone(
    new Date(meeting.date),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    'h:mm a'
  );

  // Group responses by status
  const responsesByStatus = {
    YES: meeting.responses.filter((r) => r.status === 'YES'),
    NO: meeting.responses.filter((r) => r.status === 'NO'),
    MAYBE: meeting.responses.filter((r) => r.status === 'MAYBE'),
  };

  // Count RSVPs
  const rsvpCounts = {
    YES: responsesByStatus.YES.length,
    NO: responsesByStatus.NO.length,
    MAYBE: responsesByStatus.MAYBE.length,
  };

  // Generate tooltip content for each status
  const getTooltipContent = (responses: MeetingResponseWithUser[]) => {
    if (responses.length === 0) return 'No responses yet';

    return responses
      .map(
        (response) =>
          response.user.username ||
          response.user.firstName ||
          response.user.lastName ||
          'Anonymous'
      )
      .join('\n');
  };

  // Find user's RSVP if any
  const userRsvp = meeting.responses.find((r) => r.user.clerkId === userId);

  const handleEditMeeting = () => {
    if (upcomingMeeting) {
      setEditMeeting(upcomingMeeting);
      setIsMeetingModalOpen(true);
    }
  };

  const handleDeleteMeeting = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(meeting.id, {
      onSuccess: () => {
        setIsConfirmDeleteOpen(false);
      },
    });
  };

  return (
    <Box
      borderWidth='1px'
      borderRadius='lg'
      p={4}
      mb={4}
      bg='bg.subtle'
      position='relative'
    >
      <Flex direction='column' gap={3}>
        <Flex justify='space-between' align='center' mb={2}>
          <Heading as='h3' size='md'>
            {meeting.title}
          </Heading>
          {isAdmin && (
            <Flex direction='row' gap={2}>
              <Button
                size='sm'
                onClick={handleEditMeeting}
                colorPalette='purple'
                variant='outline'
              >
                <FaPencilAlt />
              </Button>

              <Button
                size='sm'
                colorPalette='red'
                variant='outline'
                onClick={handleDeleteMeeting}
              >
                <FaTrash />
              </Button>
            </Flex>
          )}
        </Flex>

        {meeting.description && (
          <Text color='fg.muted'>{meeting.description}</Text>
        )}

        <Flex align='center' gap={2}>
          <Box as={FaCalendar} color='fg.muted' />
          <Text>
            {formattedDate} at {formattedTime}
          </Text>
        </Flex>

        {(meeting.location || meeting.address) && (
          <Flex align='center' gap={2}>
            <Box as={FaMapMarkerAlt} color='fg.muted' />
            <Text>
              {meeting.location}
              {meeting.location && meeting.address && ' - '}
              {googleMapsLink ? (
                <ChakraLink
                  href={googleMapsLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  color='blue.500'
                  textDecoration='underline'
                >
                  {meeting.address}
                </ChakraLink>
              ) : (
                meeting.address
              )}
            </Text>
          </Flex>
        )}

        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify='space-between'
          align={{ base: 'flex-start', md: 'center' }}
          gap={4}
          mt={2}
        >
          <RSVPButtons
            meetingId={meeting.id}
            groupId={groupId}
            currentStatus={userRsvp?.status}
          />

          <Flex gap={4}>
            <Tooltip
              content={getTooltipContent(responsesByStatus.YES)}
              showArrow
              contentProps={{ style: { whiteSpace: 'pre-line' } }}
            >
              <Text fontSize='sm' color='green.500' cursor='pointer'>
                <strong>{rsvpCounts.YES}</strong> Going
              </Text>
            </Tooltip>

            <Tooltip
              content={getTooltipContent(responsesByStatus.NO)}
              showArrow
              contentProps={{ style: { whiteSpace: 'pre-line' } }}
            >
              <Text fontSize='sm' color='red.500' cursor='pointer'>
                <strong>{rsvpCounts.NO}</strong> Not Going
              </Text>
            </Tooltip>

            <Tooltip
              content={getTooltipContent(responsesByStatus.MAYBE)}
              showArrow
              contentProps={{ style: { whiteSpace: 'pre-line' } }}
            >
              <Text fontSize='sm' color='gray.500' cursor='pointer'>
                <strong>{rsvpCounts.MAYBE}</strong> Maybe
              </Text>
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
      <MeetingDialog
        groupId={groupId}
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        meeting={editMeeting}
      />
      <DialogWrapper
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title='Delete Meeting'
        footer={
          <Flex gap={3} justify='flex-end'>
            <Button
              onClick={() => setIsConfirmDeleteOpen(false)}
              colorPalette='gray'
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              colorPalette='red'
              loading={deleteMutation.isPending}
            >
              Delete Meeting
            </Button>
          </Flex>
        }
      >
        <Text fontSize='md' my={4}>
          Are you sure you want to delete the meeting &quot;{meeting.title}
          &quot;? This action cannot be undone.
        </Text>
      </DialogWrapper>
    </Box>
  );
}
