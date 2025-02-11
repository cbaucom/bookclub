import { Box, Flex, Progress, Stack, Text } from '@chakra-ui/react';
import { PollStatus } from '@prisma/client';
import { PollOption } from '@/types';
import { useState, useEffect } from 'react';

interface WeightedProps {
  options: PollOption[];
  status: PollStatus;
  maxPoints: number;
  userId?: string;
  onVote: (pollOptionId: string, value: number) => void;
}

export function Weighted({
  options,
  status,
  maxPoints,
  userId,
  onVote,
}: WeightedProps) {
  const [weightedVotes, setWeightedVotes] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (userId) {
      const initialVotes: Record<string, number> = {};
      options.forEach((option) => {
        const userVote =
          option.votes.find((v) => v.user.clerkId === userId)?.value ?? 0;
        initialVotes[option.id] = userVote;
      });
      setWeightedVotes(initialVotes);
    }
  }, [userId, options]);

  const totalPointsUsed = Object.values(weightedVotes).reduce(
    (sum, val) => sum + val,
    0
  );
  const pointsRemaining = maxPoints - totalPointsUsed;

  return (
    <Stack gap={4}>
      <Text color='gray.500' fontSize='sm'>
        Points remaining:{' '}
        <Text as='span' color='purple.500' fontSize='sm'>
          {pointsRemaining}
        </Text>
      </Text>
      {options.map((option) => {
        const userVote = weightedVotes[option.id] ?? 0;
        const otherVotes =
          status === PollStatus.COMPLETED
            ? option.votes
                .filter((v) => v.user.clerkId !== userId)
                .reduce((sum, v) => sum + v.value, 0)
            : 0;
        const totalPoints = otherVotes + userVote;
        const maxAllowedPoints = Math.min(
          userVote + pointsRemaining,
          maxPoints
        );

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
                  <Text fontWeight='bold'>{totalPoints} points</Text>
                ) : userVote > 0 ? (
                  <Text color='purple.500' fontSize='sm'>
                    {userVote} points
                  </Text>
                ) : null}
                <select
                  value={userVote}
                  style={{ width: '60px', padding: '2px' }}
                  onChange={(e) => onVote(option.id, parseInt(e.target.value))}
                  disabled={status !== PollStatus.ACTIVE}
                >
                  {Array.from({ length: maxAllowedPoints + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </Flex>
            </Flex>
            {status === PollStatus.COMPLETED && (
              <Progress.Root
                value={totalPoints}
                max={maxPoints * options.length}
                colorPalette='purple'
                mt={2}
              />
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
