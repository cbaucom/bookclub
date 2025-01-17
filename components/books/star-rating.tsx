import { Box, HStack, IconButton, Text, Textarea } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { FaStar } from 'react-icons/fa';
import { type ReactElement, useState } from 'react';

interface StarRatingProps {
  averageRating?: number | null;
  onRate?: (rating: number, review?: string) => void;
  size?: 'sm' | 'md' | 'lg';
  totalRatings?: number;
  userRating?: number | null;
  readOnly?: boolean;
}

export function StarRating({
  averageRating,
  onRate,
  size = 'md',
  totalRatings = 0,
  userRating,
  readOnly = false,
}: StarRatingProps): ReactElement {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [showRatingInput, setShowRatingInput] = useState(false);

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

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    setShowReview(true);
  };

  const handleSubmit = () => {
    if (selectedRating) {
      onRate?.(selectedRating, review);
      setShowReview(false);
      setReview('');
      setShowRatingInput(false);
      setSelectedRating(null);
    }
  };

  const handleCancel = () => {
    setShowRatingInput(false);
    setShowReview(false);
    setReview('');
    setSelectedRating(null);
  };

  return (
    <Box>
      <HStack gap={1} align='center'>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Box
            key={rating}
            color={rating <= (averageRating || 0) ? 'yellow.400' : 'gray.200'}
          >
            <FaStar size={iconSizes[size] * 4} />
          </Box>
        ))}
        <Text color='gray.600' fontSize={textSizes[size]} fontWeight='medium'>
          {averageRating?.toFixed(1)} ({totalRatings}{' '}
          {totalRatings === 1 ? 'rating' : 'ratings'})
        </Text>
      </HStack>

      {!showRatingInput && onRate && !readOnly && (
        <Button
          size='sm'
          variant='outline'
          mt={2}
          onClick={() => setShowRatingInput(true)}
        >
          Add Review
        </Button>
      )}

      {showRatingInput && !readOnly && (
        <Box mt={4}>
          <HStack gap={1}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <IconButton
                key={rating}
                aria-label={`Rate ${rating} stars`}
                bg='transparent'
                color={
                  rating <= (selectedRating || userRating || 0)
                    ? 'yellow.400'
                    : 'gray.200'
                }
                minW={0}
                onClick={() => handleStarClick(rating)}
                size={size}
                variant='ghost'
                _hover={{
                  bg: 'transparent',
                  color: 'yellow.500',
                }}
              >
                <FaStar size={iconSizes[size] * 4} />
              </IconButton>
            ))}
          </HStack>
          {showReview && (
            <Box mt={2}>
              <Textarea
                placeholder='Write your review (optional)'
                value={review}
                onChange={(e) => setReview(e.target.value)}
                size={size}
                mb={2}
              />
              <HStack gap={2}>
                <Button
                  colorScheme='blue'
                  onClick={handleSubmit}
                  size={size}
                  flex={1}
                >
                  Submit Rating {review ? 'and Review' : ''}
                </Button>
                <Button variant='ghost' onClick={handleCancel} size={size}>
                  Cancel
                </Button>
              </HStack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
