import {
  Box,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  Textarea,
  HStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { useCurrentBook } from '@/hooks/useCurrentBook';
import { useNotes } from '@/hooks/useNotes';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import { useState } from 'react';
import { AddBookModal } from './add-book-modal';
import { PageState } from '@/components/ui/page-state';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { StarRating } from '@/components/books/star-rating';
import { useRatings } from '@/hooks/useRatings';
import { useBookMutations } from '@/hooks/useBookMutations';
import { FaStar } from 'react-icons/fa';
import { BookDescriptionModal } from '@/components/books/book-description-modal';

interface CurrentBookProps {
  groupId: string;
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

async function fetchUser() {
  const response = await fetch('/api/protected');
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

export function CurrentBook({ groupId }: CurrentBookProps) {
  const { data: book, isLoading, error } = useCurrentBook(groupId);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const { createMutation } = useNotes(book?.id || '', groupId);
  const { updateMutation, deleteMutation } = useNoteMutations(
    book?.id || '',
    groupId
  );
  const { isSignedIn, isLoaded } = useUser();
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: isLoaded && isSignedIn,
  });
  const { rate, ratings } = useRatings(book?.id || '', groupId);
  const { deleteMutation: deleteBookMutation, finishMutation } =
    useBookMutations(book?.id || '', groupId);

  const handleRate = (rating: number, review?: string) => {
    rate({ rating, review });
  };

  const handleFinish = () => {
    if (
      window.confirm('Are you sure you want to mark this book as finished?')
    ) {
      finishMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      deleteBookMutation.mutate();
    }
  };

  if (isLoading) {
    return <PageState isLoading />;
  }

  if (error) {
    return <PageState isError error={error as Error} />;
  }

  if (!book) {
    return (
      <Box textAlign='center' py={8}>
        <Text fontSize='lg'>No current book</Text>
        <Button
          mt={4}
          colorPalette='purple'
          size='sm'
          onClick={() => setIsAddBookModalOpen(true)}
        >
          Add a Book
        </Button>
        <AddBookModal
          groupId={groupId}
          isOpen={isAddBookModalOpen}
          onClose={() => setIsAddBookModalOpen(false)}
        />
      </Box>
    );
  }

  const handleAmazonClick = () => {
    if (book.amazonUrl) {
      window.open(book.amazonUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddNote = () => {
    if (noteContent.trim()) {
      createMutation.mutate(
        { content: noteContent, bookId: book.id },
        {
          onSuccess: () => {
            setNoteContent('');
          },
        }
      );
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = book.notes.find((n) => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingNoteContent(note.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingNoteContent.trim()) {
      updateMutation.mutate(
        {
          noteId: editingNoteId,
          data: { content: editingNoteContent },
        },
        {
          onSuccess: () => {
            setEditingNoteId(null);
            setEditingNoteContent('');
          },
        }
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(noteId);
    }
  };

  return (
    <Box borderWidth='1px' borderRadius='lg' overflow='hidden'>
      <Box p={6}>
        <Flex gap={6}>
          {book.imageUrl && (
            <Image
              src={book.imageUrl}
              alt={book.title}
              borderRadius='lg'
              width='150px'
              height='225px'
              objectFit='cover'
            />
          )}
          <Box flex={1}>
            <Flex justify='space-between' align='flex-start'>
              <Box>
                <Heading as='h2' size='xl'>
                  {book.title}
                </Heading>
                <Text fontSize='lg' mt={2}>
                  by {book.author}
                </Text>
              </Box>
              <HStack>
                <Button
                  colorPalette='green'
                  onClick={handleFinish}
                  loading={finishMutation.isPending}
                >
                  Mark as Finished
                </Button>
                <Button
                  colorPalette='red'
                  onClick={handleDelete}
                  loading={deleteBookMutation.isPending}
                >
                  Delete
                </Button>
              </HStack>
            </Flex>
            {book.description && (
              <Text mt={4} color='fg.muted'>
                {book.description.length > 200 ? (
                  <>
                    {book.description.slice(0, 200)}...{' '}
                    <Button
                      variant='ghost'
                      colorPalette='blue'
                      onClick={() => setIsDescriptionOpen(true)}
                      size='sm'
                    >
                      Read more
                    </Button>
                    <BookDescriptionModal
                      isOpen={isDescriptionOpen}
                      onClose={() => setIsDescriptionOpen(false)}
                      title={book.title}
                      description={book.description}
                    />
                  </>
                ) : (
                  book.description
                )}
              </Text>
            )}
            <Box mt={4}>
              <StarRating
                averageRating={book.averageRating}
                onRate={handleRate}
                size='lg'
                totalRatings={book.totalRatings}
                userRating={book.userRating}
              />
            </Box>
            {book.amazonUrl && (
              <Button
                onClick={handleAmazonClick}
                mt={4}
                colorPalette='orange'
                padding={4}
                size='xs'
              >
                View on Amazon
              </Button>
            )}
            {ratings && ratings.length > 0 && (
              <Box mt={6}>
                <Heading as='h3' size='md' mb={4}>
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

      <Box p={6}>
        <Stack direction='column' gap={6}>
          <Box>
            <Heading as='h3' size='md' mb={4}>
              Notes
            </Heading>
            {book.notes && book.notes.length === 0 ? (
              <Text color='gray.600'>No notes yet</Text>
            ) : (
              <Stack direction='column' gap={4}>
                {book.notes &&
                  book.notes.map((note) => (
                    <Box
                      key={note.id}
                      p={4}
                      borderWidth='1px'
                      borderRadius='md'
                    >
                      {editingNoteId === note.id ? (
                        <Box>
                          <Textarea
                            padding={4}
                            value={editingNoteContent}
                            onChange={(e) =>
                              setEditingNoteContent(e.target.value)
                            }
                          />
                          <Flex gap={2} mt={2}>
                            <Button
                              size='sm'
                              colorPalette='blue'
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size='sm'
                              colorPalette='gray'
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </Flex>
                        </Box>
                      ) : (
                        <>
                          <Flex justify='space-between' align='center'>
                            <Flex direction='column'>
                              <Text>{note.content}</Text>
                              <Flex gap={4} align='center'>
                                <Text fontSize='sm' color='fg.muted'>
                                  {note.user.firstName} {note.user.lastName}
                                </Text>
                                <Text fontSize='sm' color='fg.muted'>
                                  {new Date(
                                    note.createdAt
                                  ).toLocaleDateString()}
                                </Text>
                              </Flex>
                            </Flex>
                            {user && note.userId === user.id && (
                              <Flex gap={2}>
                                <Button
                                  size='sm'
                                  colorPalette='blue'
                                  onClick={() => handleEditNote(note.id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size='sm'
                                  colorPalette='red'
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  {deleteMutation.isPending
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </Button>
                              </Flex>
                            )}
                          </Flex>
                        </>
                      )}
                    </Box>
                  ))}
              </Stack>
            )}
          </Box>
          <Box>
            <Heading as='h3' size='md' mb={4}>
              Add a Note
            </Heading>
            <Textarea
              padding={4}
              placeholder='Write your thoughts about the book...'
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <Button
              mt={4}
              colorPalette='purple'
              padding={4}
              onClick={handleAddNote}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Note'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
