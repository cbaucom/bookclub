import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Dashboard from '@/app/dashboard/page';
import * as groupHooks from '@/hooks/useGroups';
import * as mutationHooks from '@/hooks/useGroupMutations';
import { Privacy } from '@prisma/client';
import type { GroupWithRole } from '@/types';

// Mock the hooks
jest.mock('@/hooks/useGroups', () => ({
  useGroups: jest.fn(),
}));

jest.mock('@/hooks/useGroupMutations', () => ({
  useGroupMutations: jest.fn(),
}));

const mockGroups: GroupWithRole[] = [
  {
    id: '1',
    name: 'Book Club 1',
    description: 'First book club',
    privacy: Privacy.PUBLIC,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Book Club 2',
    description: 'Second book club',
    privacy: Privacy.PRIVATE,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'MEMBER',
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ChakraProvider>
  );
}

describe('Dashboard', () => {
  const mockCreateMutate = jest.fn();
  const mockDeleteMutate = jest.fn();

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();

    // Mock useGroups implementation
    (groupHooks.useGroups as jest.Mock).mockReturnValue({
      data: mockGroups,
      error: null,
      isLoading: false,
      status: 'success',
    });

    // Mock useGroupMutations implementation
    (mutationHooks.useGroupMutations as jest.Mock).mockReturnValue({
      createMutation: {
        mutate: mockCreateMutate,
        data: undefined,
        error: null,
        isError: false,
        status: 'idle',
        reset: jest.fn(),
      },
      deleteMutation: {
        mutate: mockDeleteMutate,
        data: undefined,
        error: null,
        isError: false,
        status: 'idle',
        reset: jest.fn(),
      },
    });
  });

  it('renders groups', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Your Groups')).toBeInTheDocument();
    expect(screen.getByText('Book Club 1')).toBeInTheDocument();
    expect(screen.getByText('Book Club 2')).toBeInTheDocument();
  });

  it('creates a new group', async () => {
    renderWithProviders(<Dashboard />);

    const newGroupName = 'New Book Club';
    const newGroupDesc = 'A new book club description';

    const nameInput = screen.getByPlaceholderText(/group name/i);
    const descInput = screen.getByPlaceholderText(/description/i);
    const createButton = screen.getByRole('button', { name: /create/i });

    fireEvent.change(nameInput, { target: { value: newGroupName } });
    fireEvent.change(descInput, { target: { value: newGroupDesc } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: newGroupName,
        description: newGroupDesc,
        privacy: Privacy.PUBLIC,
      });
    });
  });

  it('deletes a group', async () => {
    renderWithProviders(<Dashboard />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]); // Delete first group

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith('1');
    });
  });

  it('shows loading state', () => {
    (groupHooks.useGroups as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      status: 'loading',
    });

    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (groupHooks.useGroups as jest.Mock).mockReturnValue({
      data: undefined,
      error: new Error('Failed to fetch groups'),
      isError: true,
      status: 'error',
      isLoading: false,
    });

    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
