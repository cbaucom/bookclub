import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { PollStatus } from '@prisma/client';
import { PollOption } from '@/types';

interface UpvoteDownvoteProps {
  options: PollOption[];
  status: PollStatus;
  userId?: string;
  onVote: (pollOptionId: string) => void;
}

export function UpvoteDownvote({
  options,
  status,
  userId,
  onVote,
}: UpvoteDownvoteProps) {
  return (
    <Stack gap={4}>
      {options.map((option) => {
        const hasVoted = option.votes.some((v) => v.user.clerkId === userId);

        return (
          <Box key={option.id} bg='whiteAlpha.50' borderRadius='lg' p={4}>
            <Flex align='center' justify='space-between'>
              <Box>
                <Text fontWeight='bold'>{option.book.title}</Text>
                <Text color='gray.500' fontSize='sm'>
                  {option.book.author}
                </Text>
              </Box>
              <Flex align='center' gap={2}>
                {status === PollStatus.COMPLETED ? (
                  <Text
                    color={option.votes.length > 0 ? 'green.500' : 'gray.500'}
                    fontWeight='bold'
                  >
                    {option.votes.length} vote
                    {option.votes.length === 1 ? '' : 's'}
                  </Text>
                ) : (
                  hasVoted && (
                    <Text color='green.500' fontSize='sm'>
                      Voted
                    </Text>
                  )
                )}
                <Button
                  onClick={() => onVote(option.id)}
                  size='sm'
                  variant={hasVoted ? 'solid' : 'ghost'}
                  colorPalette={hasVoted ? 'green' : 'gray'}
                  disabled={status !== PollStatus.ACTIVE}
                >
                  👍
                </Button>
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </Stack>
  );
}
