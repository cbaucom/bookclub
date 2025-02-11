import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { PollStatus } from '@prisma/client';
import { PollOption } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RankedChoiceProps {
  options: PollOption[];
  status: PollStatus;
  onRankChange: (event: DragEndEvent) => void;
}

interface SortableItemProps {
  id: string;
  title: string;
  author: string;
  rank: number;
}

function SortableItem({ id, title, author, rank }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      bg='whiteAlpha.50'
      borderRadius='lg'
      p={4}
    >
      <Flex align='center' justify='space-between'>
        <Box>
          <Text fontWeight='bold'>{title}</Text>
          <Text color='gray.500' fontSize='sm'>
            {author}
          </Text>
        </Box>
        <Text fontSize='lg' fontWeight='bold' opacity={0.5}>
          #{rank}
        </Text>
      </Flex>
    </Box>
  );
}

export function RankedChoice({
  options,
  status,
  onRankChange,
}: RankedChoiceProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const items = options
    .sort((a, b) => {
      const aVotes = a.votes[0]?.value || Number.MAX_SAFE_INTEGER;
      const bVotes = b.votes[0]?.value || Number.MAX_SAFE_INTEGER;
      return aVotes - bVotes;
    })
    .map((option, index) => ({
      id: option.id,
      title: option.book.title,
      author: option.book.author,
      rank: index + 1,
    }));

  if (status === PollStatus.COMPLETED) {
    return (
      <Stack gap={4}>
        {items.map((item) => (
          <Box key={item.id} bg='whiteAlpha.50' borderRadius='lg' p={4}>
            <Flex align='center' justify='space-between'>
              <Box>
                <Text fontWeight='bold'>{item.title}</Text>
                <Text color='gray.500' fontSize='sm'>
                  {item.author}
                </Text>
              </Box>
              <Text fontSize='lg' fontWeight='bold' opacity={0.5}>
                Final Rank: #{item.rank}
              </Text>
            </Flex>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onRankChange}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap={4}>
          {items.map((item) => (
            <SortableItem key={item.id} {...item} />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}
