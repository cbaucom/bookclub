import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
  Stack,
  HStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { Book } from '@prisma/client';
import { useState } from 'react';
import { AddBookModal } from './add-book-modal';
import { StarRating } from '@/components/books/star-rating';
import { useRatings } from '@/hooks/useRatings';
import { useBookMutations } from '@/hooks/useBookMutations';
import { FaStar } from 'react-icons/fa';

interface BookWithRatings extends Book {
  averageRating?: number | null;
  totalRatings?: number;
  userRating?: number | null;
}

function ReviewItem({
  review,
}: {
  review: {
    rating: number;
    review?: string | null;
    user: { firstName: string | null; lastName: string | null };
  };
}) {
  return (
    <Box p={3} borderWidth={1} borderRadius='md' bg='gray.50'>
      <Flex align='center' gap={2}>
        <Text fontWeight='medium'>
          {review.user.firstName} {review.user.lastName}
        </Text>
        <HStack gap={1}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} color={i < review.rating ? 'yellow.400' : 'gray.200'}>
              <FaStar size={12} />
            </Box>
          ))}
        </HStack>
      </Flex>
      {review.review && (
        <Text mt={2} fontSize='sm'>
          {review.review}
        </Text>
      )}
    </Box>
  );
}

function BookCard({
  book,
  groupId,
}: {
  book: BookWithRatings;
  groupId: string;
}) {
  const { rate, ratings } = useRatings(book.id, groupId);
  const { deleteMutation } = useBookMutations(book.id, groupId);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      deleteMutation.mutate();
    }
  };

  const handleRate = (rating: number, review?: string) =>
    rate({ rating, review });

  return (
    <Box borderWidth='1px' borderRadius='lg' overflow='hidden' p={4}>
      <Flex gap={4}>
        {book.imageUrl && (
          <Image
            src={book.imageUrl}
            alt={book.title}
            width='100px'
            height='150px'
            objectFit='cover'
            borderRadius='md'
          />
        )}
        <Box flex={1}>
          <Flex justify='space-between' align='flex-start'>
            <Heading as='h3' size='md'>
              {book.title}
            </Heading>
            <Button
              size='sm'
              colorPalette='red'
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Flex>
          <Text mt={2}>{book.author}</Text>
          <Box mt={2}>
            <StarRating
              averageRating={book.averageRating}
              onRate={handleRate}
              size='sm'
              totalRatings={book.totalRatings}
              userRating={book.userRating}
            />
          </Box>
          {book.startDate && (
            <Text fontSize='sm' color='gray.600' mt={2}>
              Started: {new Date(book.startDate).toLocaleDateString()}
            </Text>
          )}
          {book.endDate && (
            <Text fontSize='sm' color='gray.600'>
              Finished: {new Date(book.endDate).toLocaleDateString()}
            </Text>
          )}
          {book.amazonUrl && (
            <Button
              onClick={() =>
                window.open(book.amazonUrl!, '_blank', 'noopener,noreferrer')
              }
              size='sm'
              mt={2}
              colorPalette='orange'
            >
              View on Amazon
            </Button>
          )}
          {ratings && ratings.length > 0 && (
            <Box mt={4}>
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
      </Flex>
    </Box>
  );
}

async function fetchBooks(
  groupId: string,
  status: string
): Promise<BookWithRatings[]> {
  const response = await fetch(`/api/groups/${groupId}/books?status=${status}`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

interface BookListProps {
  groupId: string;
  status: 'CURRENT' | 'PREVIOUS' | 'UPCOMING';
}

export function BookList({ groupId, status }: BookListProps) {
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', groupId, status],
    queryFn: () => fetchBooks(groupId, status),
  });

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
    <Box>
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
          Add Book
        </Button>
      </Flex>

      <Grid
        templateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
        gap={6}
      >
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
