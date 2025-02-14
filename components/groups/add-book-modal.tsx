import { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Image,
  Input,
  VStack,
  Text,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { toaster } from '@/components/ui/toaster';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SearchBook } from '@/types';
import { BASE_URL } from '@/lib/constants';
import { useBookSearch } from '@/hooks/useBookSearch';

interface AddBookModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: 'CURRENT' | 'PREVIOUS' | 'UPCOMING';
}

async function addBook(groupId: string, book: SearchBook, status?: string) {
  const bookData = {
    id: book.id,
    title: book.title,
    author: book.author || 'Unknown Author',
    description: book.description || '',
    imageUrl: book.imageUrl || '',
    amazonUrl: book.amazonUrl || '',
    subtitle: book.subtitle || '',
    pageCount: book.pageCount || null,
    categories: book.categories || '',
    textSnippet: book.textSnippet || '',
    status: status || 'CURRENT',
  };

  const response = await fetch(`${BASE_URL}/api/groups/${groupId}/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to add book');
  }

  return data;
}

export function AddBookModal({
  groupId,
  isOpen,
  onClose,
  defaultStatus,
}: AddBookModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { data: books = [], isLoading } = useBookSearch(searchQuery);

  const addBookMutation = useMutation({
    mutationFn: (book: SearchBook) => addBook(groupId, book, defaultStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', groupId] });
      queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
      // Explicitly refetch the current book query
      queryClient.refetchQueries({ queryKey: ['currentBook', groupId] });
      // Clear the search cache when a book is added
      queryClient.removeQueries({ queryKey: ['books', 'search'] });
      onClose();
      setSearchQuery('');
      toaster.create({
        title: 'Book added successfully',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      toaster.create({
        title: 'Failed to add book',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddBook = (book: SearchBook) => {
    addBookMutation.mutate(book);
  };

  // Clear search results when modal is closed
  const handleClose = () => {
    queryClient.removeQueries({ queryKey: ['books', 'search'] });
    setSearchQuery('');
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={handleClose} title='Add a Book'>
      <VStack gap={4} w='100%' maxW='100%' overflow='hidden'>
        <Box width='100%'>
          <Input
            onChange={handleSearch}
            placeholder='Search for a book...'
            px={2}
            size='lg'
            type='text'
            value={searchQuery}
          />
        </Box>

        {isLoading && <Text>Searching...</Text>}

        <VStack gap={4} width='100%' maxW='100%' overflow='hidden'>
          {books.map((book) => (
            <Box
              key={book.id}
              p={4}
              borderWidth={1}
              borderRadius='md'
              _hover={{ borderColor: 'purple.500' }}
              width='100%'
              maxW='100%'
            >
              <Flex gap={4} flexWrap={{ base: 'wrap', sm: 'nowrap' }}>
                {book.imageUrl && (
                  <Image
                    src={book.imageUrl}
                    alt={book.title}
                    width='60px'
                    height='90px'
                    objectFit='cover'
                    borderRadius='md'
                    flexShrink={0}
                  />
                )}
                <Box flex='1' minW={0}>
                  <Heading size='md'>{book.title}</Heading>
                  <Text color='fg.muted' fontSize='sm'>
                    by {book.author}
                  </Text>
                  {book.description && (
                    <Text color='fg.muted' fontSize='sm' mt={2}>
                      {book.description.slice(0, 150)}
                      {book.description.length > 150 && '...'}
                    </Text>
                  )}
                  <Button
                    colorPalette='purple'
                    loading={addBookMutation.isPending}
                    mt={2}
                    onClick={() => handleAddBook(book)}
                    size='xs'
                  >
                    Add to Group
                  </Button>
                </Box>
              </Flex>
            </Box>
          ))}
        </VStack>
      </VStack>
    </DialogWrapper>
  );
}
