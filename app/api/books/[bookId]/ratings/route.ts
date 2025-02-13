import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

// Get ratings for a book
export async function GET(
	request: Request,
	context: { params: Promise<{ bookId: string }> }
) {
	try {
		const { bookId } = await context.params;

		const ratings = await prisma.rating.findMany({
			where: { bookId },
			include: {
				user: {
					select: {
						id: true,
						clerkId: true,
						firstName: true,
						lastName: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(ratings);
	} catch (error) {
		console.error('Failed to fetch ratings:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch ratings' },
			{ status: 500 }
		);
	}
}

// Add or update a rating
export async function POST(
	request: Request,
	context: { params: Promise<{ bookId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		const { bookId } = await context.params;

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify the book exists
		const book = await prisma.book.findUnique({
			where: { id: bookId },
		});

		if (!book) {
			return NextResponse.json(
				{ error: 'Book not found' },
				{ status: 404 }
			);
		}

		const data = await request.json();

		const { rating, review } = data;

		if (!rating || rating < 0 || rating > 5) {
			return NextResponse.json(
				{ error: 'Rating must be between 0 and 5' },
				{ status: 400 }
			);
		}

		// Upsert the rating (create if doesn't exist, update if it does)
		const updatedRating = await prisma.rating.upsert({
			where: {
				bookId_userId: {
					bookId,
					userId: user.id,
				},
			},
			create: {
				rating,
				review,
				bookId,
				userId: user.id,
			},
			update: {
				rating,
				review,
			},
			include: {
				user: {
					select: {
						id: true,
						clerkId: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return NextResponse.json(updatedRating);
	} catch (error) {
		// Enhanced error logging
		console.error('Failed to save rating:', {
			error,
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Failed to save rating',
				details: process.env.NODE_ENV === 'development' ? error : undefined
			},
			{ status: 500 }
		);
	}
}