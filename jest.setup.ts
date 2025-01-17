import '@testing-library/jest-dom'
import React from 'react'

// Polyfill for structuredClone
if (typeof structuredClone === 'undefined') {
	global.structuredClone = (obj: unknown) => {
		if (obj === undefined) return undefined;
		return JSON.parse(JSON.stringify(obj));
	};
}

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
	auth: () => new Promise((resolve) => resolve({ userId: 'user_123' })),
	currentUser: () => new Promise((resolve) => resolve({ id: 'user_123', emailAddresses: [{ emailAddress: 'test@example.com' }] })),
	useAuth: () => ({
		isLoaded: true,
		isSignedIn: true,
		userId: 'user_123'
	}),
	ClerkProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
	useUser: () => ({
		isLoaded: true,
		isSignedIn: true,
		user: {
			id: 'user_123',
			fullName: 'Test User',
			emailAddresses: [{ emailAddress: 'test@example.com' }]
		}
	}),
	SignInButton: () => React.createElement('button', null, 'Sign In')
}));

// Mock React Query hooks
jest.mock('@/hooks/useGroups', () => ({
	useGroups: () => ({
		data: [],
		isLoading: false,
		error: null
	})
}));

jest.mock('@/hooks/useGroupMutations', () => ({
	useGroupMutations: () => ({
		createMutation: {
			mutate: jest.fn(),
			isLoading: false
		},
		deleteMutation: {
			mutate: jest.fn(),
			isLoading: false
		}
	})
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
		};
	},
	useSearchParams() {
		return new URLSearchParams();
	},
	usePathname() {
		return '';
	},
}));

// Mock next/headers
jest.mock('next/headers', () => ({
	cookies() {
		return {
			get: jest.fn(),
			set: jest.fn(),
			delete: jest.fn(),
		};
	},
	headers() {
		return new Headers();
	},
}));
