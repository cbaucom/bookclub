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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Book } from '@prisma/client';
import { BASE_URL } from '@/lib/constants';

interface AddBookModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: 'CURRENT' | 'PREVIOUS' | 'UPCOMING';
}

async function searchBooks(query: string): Promise<Book[]> {
  if (!query) return [];
  const response = await fetch(
    `/api/books/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error('Failed to search books');
  return response.json();
}

async function addBook(groupId: string, book: Book, status?: string) {
  const bookData = {
    title: book.title,
    author: book.author || 'Unknown Author',
    description: book.description || '',
    imageUrl: book.imageUrl || '',
    amazonUrl: book.amazonUrl || '',
    status: status || 'CURRENT',
  };

  console.log('Sending book data:', bookData);

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

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['book-search', searchQuery],
    queryFn: () => searchBooks(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const addBookMutation = useMutation({
    mutationFn: (book: Book) => addBook(groupId, book, defaultStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', groupId] });
      queryClient.invalidateQueries({ queryKey: ['currentBook', groupId] });
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

  const handleAddBook = (book: Book) => {
    addBookMutation.mutate(book);
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title='Add a Book'>
      <VStack gap={4}>
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

        <VStack gap={4} width='100%'>
          {books.map((book) => (
            <Box
              key={book.id}
              p={4}
              borderWidth={1}
              borderRadius='md'
              _hover={{ borderColor: 'purple.500' }}
              width='100%'
            >
              <Flex gap={4}>
                {book.imageUrl && (
                  <Image
                    src={book.imageUrl}
                    alt={book.title}
                    width='60px'
                    height='90px'
                    objectFit='cover'
                    borderRadius='md'
                  />
                )}
                <Box flex='1'>
                  <Heading size='md'>{book.title}</Heading>
                  <Text color='fg.muted' fontSize='sm'>
                    by {book.author}
                  </Text>
                  {book.description && (
                    <Text color='fg.muted' fontSize='sm' mt={2}>
                      {book.description}
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
