import {
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  Button,
} from '@chakra-ui/react';
import { PollStatus } from '@prisma/client';
import { PollOption } from '@/types';

interface BracketProps {
  options: PollOption[];
  status: PollStatus;
  userId?: string;
  onVote: (pollOptionId: string) => void;
}

export function Bracket({ options, status, userId, onVote }: BracketProps) {
  const currentRound = Math.max(...options.map((o) => o.round || 0));
  const matchups = options.reduce(
    (acc, option) => {
      if (option.round !== currentRound) return acc;
      const matchup = option.matchup || 0;
      if (!acc[matchup]) acc[matchup] = [];
      acc[matchup].push(option);
      return acc;
    },
    {} as Record<number, typeof options>
  );

  return (
    <Stack gap={8}>
      <Heading size='sm'>Round {currentRound}</Heading>
      <Grid gap={4} templateColumns='repeat(auto-fit, minmax(300px, 1fr))'>
        {Object.values(matchups).map((matchup) => (
          <Card.Root key={matchup[0].matchup}>
            <Card.Header>
              <Heading size='sm'>Matchup {matchup[0].matchup}</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {matchup.map((option) => {
                  const votes = option.votes.length;
                  const userVoted = option.votes.some(
                    (v) => v.user.clerkId === userId
                  );

                  return (
                    <Box
                      key={option.id}
                      bg='whiteAlpha.50'
                      borderRadius='lg'
                      p={4}
                    >
                      <Flex align='center' justify='space-between'>
                        <Box>
                          <Text fontWeight='bold'>{option.book.title}</Text>
                          <Text color='gray.500' fontSize='sm'>
                            {option.book.author}
                          </Text>
                        </Box>
                        <Flex align='center' gap={2}>
                          {status === PollStatus.COMPLETED ? (
                            <Text fontWeight='bold'>{votes} votes</Text>
                          ) : userVoted ? (
                            <Text color='purple.500' fontSize='sm'>
                              Voted
                            </Text>
                          ) : null}
                          <Button
                            colorPalette={userVoted ? 'purple' : 'gray'}
                            disabled={userVoted || status !== PollStatus.ACTIVE}
                            onClick={() => onVote(option.id)}
                            size='sm'
                          >
                            Vote
                          </Button>
                        </Flex>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
    </Stack>
  );
}
