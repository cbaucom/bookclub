import { Box, Input, Stack, Text } from '@chakra-ui/react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useState } from 'react';

interface BookSearchProps {
  onSelect: (bookId: string) => void;
  selectedBookIds: Array<string>;
}

export function BookSearch({ onSelect, selectedBookIds }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const { data: books, isLoading } = useBookSearch(query);

  return (
    <Stack gap={2}>
      <Input
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search for books...'
        size='lg'
        value={query}
      />

      {isLoading && <Text>Loading...</Text>}

      <Stack gap={2} maxHeight='300px' overflowY='auto'>
        {books?.map((book) => (
          <Box
            key={book.id}
            bg={
              selectedBookIds.includes(book.id) ? 'purple.100' : 'whiteAlpha.50'
            }
            borderRadius='lg'
            cursor='pointer'
            onClick={() => onSelect(book.id)}
            p={4}
          >
            <Text
              color={
                selectedBookIds.includes(book.id) ? 'purple.500' : 'fg.info'
              }
              fontWeight='bold'
            >
              {book.title}
            </Text>
            <Text color='gray.500' fontSize='sm'>
              {book.author}
            </Text>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
