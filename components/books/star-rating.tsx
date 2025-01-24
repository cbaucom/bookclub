import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { DialogWrapper } from '@/components/ui/dialog/dialog-wrapper';
import { FaStar } from 'react-icons/fa';
import { type ReactElement, useState } from 'react';
import { useTheme } from 'next-themes';

interface StarRatingProps {
  averageRating?: number | null;
  onRate?: (rating: number, review?: string) => void;
  size?: 'sm' | 'md' | 'lg';
  totalRatings?: number;
  userRating?: number | null;
  readOnly?: boolean;
}

export function ReviewItem({
  review,
}: {
  review: {
    rating: number;
    review?: string | null;
    user: { firstName: string | null; lastName: string | null };
  };
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Box
      p={3}
      borderWidth={1}
      borderRadius='md'
      bg={isDark ? 'gray.700' : 'gray.50'}
      borderColor={isDark ? 'gray.600' : 'gray.200'}
      boxShadow={isDark ? 'md' : 'none'}
    >
      <Flex align='center' gap={2}>
        <Text fontWeight='medium' color={isDark ? 'white' : 'gray.900'}>
          {review.user.firstName} {review.user.lastName}
        </Text>
        <HStack gap={1}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              color={
                i < review.rating
                  ? 'yellow.400'
                  : isDark
                    ? 'gray.500'
                    : 'gray.200'
              }
            >
              <FaStar size={12} />
            </Box>
          ))}
        </HStack>
      </Flex>
      {review.review && (
        <Text mt={2} fontSize='sm' color={isDark ? 'gray.200' : 'gray.700'}>
          {review.review}
        </Text>
      )}
    </Box>
  );
}

export function StarRating({
  averageRating,
  onRate,
  size = 'md',
  totalRatings = 0,
  userRating,
  readOnly = false,
}: StarRatingProps): ReactElement {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempRating, setTempRating] = useState<number | null>(null);

  const iconSizes = {
    sm: 4,
    md: 6,
    lg: 8,
  };

  const textSizes = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedRating) {
      // Wrapped the onRate call in a setTimeout to break the event chain. This ensures that any event propagation is completed before we execute the rating action.
      setTimeout(() => {
        onRate?.(selectedRating, review);
        handleClose();
      }, 0);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setReview('');
    setSelectedRating(null);
    setTempRating(null);
  };

  const footer = (
    <Box
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        colorPalette='purple'
        onClick={handleSubmit}
        size='xs'
        mr={3}
        disabled={!selectedRating}
      >
        Submit{review ? ' with Review' : ''}
      </Button>
      <Button
        variant='ghost'
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
      >
        Cancel
      </Button>
    </Box>
  );

  return (
    <Box>
      <HStack gap={1} align='center'>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Box
            key={rating}
            color={
              rating <= (averageRating || 0)
                ? 'yellow.400'
                : isDark
                  ? 'gray.600'
                  : 'gray.200'
            }
          >
            <FaStar size={iconSizes[size] * 4} />
          </Box>
        ))}
        <Text
          color={isDark ? 'gray.400' : 'gray.600'}
          fontSize={textSizes[size]}
          fontWeight='medium'
        >
          {averageRating?.toFixed(1)} ({totalRatings}{' '}
          {totalRatings === 1 ? 'rating' : 'ratings'})
        </Text>
      </HStack>

      {onRate && !readOnly && (
        <Box mt={2}>
          <Button
            size='sm'
            variant='outline'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            {userRating ? 'Change Review' : 'Add Review'}
          </Button>
        </Box>
      )}

      {isModalOpen && (
        <DialogWrapper
          isOpen={isModalOpen}
          onClose={handleClose}
          title={userRating ? 'Change Review' : 'Add Review'}
          footer={footer}
        >
          <Box
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <HStack gap={1} mb={4} justify='center'>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  aria-label={`Rate ${rating} stars`}
                  bg='transparent'
                  color={
                    rating <= (tempRating || selectedRating || userRating || 0)
                      ? 'yellow.400'
                      : isDark
                        ? 'gray.600'
                        : 'gray.200'
                  }
                  minW={0}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedRating(rating);
                  }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTempRating(rating);
                  }}
                  onMouseLeave={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTempRating(null);
                  }}
                  size='lg'
                  variant='ghost'
                  _hover={{
                    bg: 'transparent',
                    color: 'yellow.500',
                  }}
                >
                  <FaStar size={iconSizes.lg * 4} />
                </IconButton>
              ))}
            </HStack>
            <Textarea
              bg={isDark ? 'gray.800' : 'white'}
              borderColor={isDark ? 'gray.600' : 'gray.200'}
              mb={4}
              p={2}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                e.preventDefault();
                e.stopPropagation();
                setReview(e.target.value);
              }}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              placeholder='Write your review (optional)'
              rows={4}
              size='md'
              value={review}
              _hover={{
                borderColor: isDark ? 'gray.500' : 'gray.300',
              }}
              _focus={{
                borderColor: 'purple.500',
                boxShadow: `0 0 0 1px ${isDark ? 'purple.500' : 'purple.500'}`,
              }}
            />
          </Box>
        </DialogWrapper>
      )}
    </Box>
  );
}
