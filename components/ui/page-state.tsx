import { Box, Container, Flex, Spinner, Text } from '@chakra-ui/react';

interface PageStateProps {
  isError?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  notFound?: boolean;
  notFoundMessage?: string;
}

export function PageState({
  isError,
  isLoading,
  error,
  notFound,
  notFoundMessage = 'Not found',
}: PageStateProps) {
  let content = null;

  if (isLoading) {
    content = (
      <Flex align='center' gap={4}>
        <Spinner size='md' color='blue.500' />
        <Text>Loading...</Text>
      </Flex>
    );
  } else if (isError) {
    content = (
      <Text color='red.500'>
        {error?.message || 'An error occurred. Please try again.'}
      </Text>
    );
  } else if (notFound) {
    content = <Text>{notFoundMessage}</Text>;
  }

  if (!content) return null;

  return (
    <Box w='full' minH='60vh'>
      <Container maxW='6xl' px={4} mx='auto'>
        <Flex align='center' justify='center' minH='60vh'>
          {content}
        </Flex>
      </Container>
    </Box>
  );
}
