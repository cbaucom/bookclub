import {
  Box,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddBookModal } from './add-book-modal';
import { StarRating } from '@/components/books/star-rating';
import { useRatings } from '@/hooks/useRatings';
import { FaTrash, FaAmazon, FaBookOpen } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useBooks } from '@/hooks/useBooks';
import { BookWithRatings } from '@/types';
import { ReviewItem } from '@/components/books/star-rating';
import { DeleteBookDialog } from './delete-book-dialog';

function BookCard({
  book,
  groupId,
}: {
  book: BookWithRatings;
  groupId: string;
}) {
  const { rate, ratings } = useRatings(book.id, groupId);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isAdmin } = useIsAdmin(groupId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleRate = (rating: number, review?: string) =>
    rate({ rating, review });

  return (
    <Box
      borderWidth='1px'
      borderRadius='lg'
      bg={isDark ? 'gray.800' : 'white'}
      boxShadow='sm'
      _hover={{ boxShadow: 'md' }}
      transition='all 0.2s'
      height='100%'
      display='flex'
      flexDirection='column'
    >
      <Box flex='1' minH={0}>
        <Grid templateColumns={{ base: '100px 1fr', md: '120px 1fr' }} gap={4}>
          {book.imageUrl && (
            <Box position='relative'>
              <Box
                position='relative'
                paddingBottom='150%' // 2:3 aspect ratio
                width='100%'
              >
                <Image
                  src={book.imageUrl}
                  alt={book.title}
                  position='absolute'
                  top={0}
                  left={0}
                  width='100%'
                  height='100%'
                  objectFit='cover'
                  borderRightWidth='1px'
                  borderColor={isDark ? 'gray.700' : 'gray.100'}
                />
              </Box>
            </Box>
          )}
          <Box p={4} pt={3} display='flex' flexDirection='column' minH={0}>
            <Flex direction='column' gap={3} flex='1'>
              <Flex justify='space-between' align='flex-start' gap={2}>
                <VStack align='flex-start' gap={1} flex={1}>
                  <Heading
                    as='h3'
                    size='md'
                    maxW='100%'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    css={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {book.title}
                  </Heading>
                  <Text
                    color={isDark ? 'gray.400' : 'gray.600'}
                    fontSize='sm'
                    maxW='100%'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    whiteSpace='nowrap'
                  >
                    {book.author}
                  </Text>
                </VStack>
                {isAdmin && (
                  <>
                    <Button
                      size='sm'
                      colorPalette='red'
                      variant='ghost'
                      onClick={() => setIsDeleteDialogOpen(true)}
                      flexShrink={0}
                    >
                      <FaTrash />
                    </Button>
                    <DeleteBookDialog
                      bookId={book.id}
                      groupId={groupId}
                      isOpen={isDeleteDialogOpen}
                      onClose={() => setIsDeleteDialogOpen(false)}
                      title={book.title}
                    />
                  </>
                )}
              </Flex>

              <Box>
                <StarRating
                  averageRating={book.averageRating}
                  onRate={handleRate}
                  size='sm'
                  totalRatings={book.totalRatings}
                  userRating={book.userRating}
                />
              </Box>

              <Stack gap={1} mt='auto'>
                {book.startDate && (
                  <Text fontSize='xs' color={isDark ? 'gray.400' : 'gray.600'}>
                    Started: {new Date(book.startDate).toLocaleDateString()}
                  </Text>
                )}
                {book.endDate && (
                  <Text fontSize='xs' color={isDark ? 'gray.400' : 'gray.600'}>
                    Finished: {new Date(book.endDate).toLocaleDateString()}
                  </Text>
                )}
              </Stack>

              {book.amazonUrl && (
                <Button
                  onClick={() =>
                    window.open(
                      book.amazonUrl!,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  size='sm'
                  colorPalette='orange'
                  width='fit-content'
                  mt={2}
                >
                  <FaAmazon /> View on Amazon
                </Button>
              )}
            </Flex>
          </Box>
        </Grid>
      </Box>

      {ratings && ratings.length > 0 && (
        <Box
          borderTopWidth='1px'
          borderColor={isDark ? 'gray.700' : 'gray.100'}
          p={4}
          bg={isDark ? 'gray.900' : 'gray.50'}
        >
          <Heading as='h4' size='sm' mb={2}>
            Reviews
          </Heading>
          <Stack gap={3}>
            {ratings.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

interface BookListProps {
  groupId: string;
  status: 'CURRENT' | 'PREVIOUS' | 'UPCOMING';
}

export function BookList({ groupId, status }: BookListProps) {
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const { data: books, isLoading } = useBooks(groupId, status);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!books?.length) {
    return (
      <Box textAlign='center' py={8}>
        <Text fontSize='lg' mb={4}>
          {status === 'PREVIOUS'
            ? "You haven't added any books you've read yet"
            : status === 'UPCOMING'
              ? "You haven't added any books to read next"
              : 'No books found'}
        </Text>
        <Button
          colorPalette='purple'
          onClick={() => setIsAddBookModalOpen(true)}
        >
          Add {status === 'PREVIOUS' ? "a Book You've Read" : 'a Book'}
        </Button>
        <AddBookModal
          groupId={groupId}
          isOpen={isAddBookModalOpen}
          onClose={() => setIsAddBookModalOpen(false)}
          defaultStatus={status}
        />
      </Box>
    );
  }

  return (
    <Box mt={8}>
      <Flex justify='space-between' align='center' mb={6}>
        <Heading as='h3' size='md'>
          {status === 'PREVIOUS'
            ? "Books You've Read"
            : status === 'UPCOMING'
              ? 'Books to Read Next'
              : 'Books'}
        </Heading>
        <Button
          colorPalette='purple'
          onClick={() => setIsAddBookModalOpen(true)}
        >
          <FaBookOpen />
          Add Book
        </Button>
      </Flex>

      <Grid templateColumns={'1fr'} gap={6}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} groupId={groupId} />
        ))}
      </Grid>
      <AddBookModal
        groupId={groupId}
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        defaultStatus={status}
      />
    </Box>
  );
}
