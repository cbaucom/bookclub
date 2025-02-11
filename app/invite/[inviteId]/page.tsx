'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button, Container, Heading, Text, Stack } from '@chakra-ui/react';
import { SignInButton } from '@clerk/nextjs';

interface InvitePageProps {
  params: {
    inviteId: string;
  };
}

export default function InvitePage({ params: { inviteId } }: InvitePageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{
    groupName: string;
    inviterName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function fetchInviteData() {
      try {
        const response = await fetch(`/api/invites/${inviteId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch invite data');
        }
        const data = await response.json();
        setInviteData(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch invite data'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchInviteData();
  }, [inviteId]);

  const handleAcceptInvite = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invites/${inviteId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invite');
      }

      const { groupId } = await response.json();
      router.push(`/groups/${groupId}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to accept invite'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxW='6xl' mx='auto' px={4} py={10}>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW='6xl' mx='auto' px={4} py={10}>
        <Stack gap={4}>
          <Heading size='lg' color='red.500'>
            Error
          </Heading>
          <Text>{error}</Text>
        </Stack>
      </Container>
    );
  }

  if (!inviteData) {
    return (
      <Container maxW='6xl' mx='auto' px={4} py={10}>
        <Stack gap={4}>
          <Heading size='lg'>Invalid Invitation</Heading>
          <Text>This invitation link is invalid or has expired.</Text>
        </Stack>
      </Container>
    );
  }

  if (!isSignedIn) {
    return (
      <Container maxW='6xl' mx='auto' px={4} py={10}>
        <Stack gap={6}>
          <Heading size='lg'>Join {inviteData.groupName}</Heading>
          <Text>
            {inviteData.inviterName} has invited you to join their group. Please
            sign in or create an account to accept this invitation.
          </Text>
          <SignInButton mode='modal'>
            <Button colorPalette='blue'>Sign In to Accept Invitation</Button>
          </SignInButton>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW='6xl' mx='auto' px={4} py={10}>
      <Stack gap={6}>
        <Heading size='lg'>Join {inviteData.groupName}</Heading>
        <Text>
          {inviteData.inviterName} has invited you to join their group.
        </Text>
        <Button
          colorPalette='blue'
          onClick={handleAcceptInvite}
          disabled={isLoading}
        >
          {isLoading ? 'Accepting...' : 'Accept Invitation'}
        </Button>
      </Stack>
    </Container>
  );
}
