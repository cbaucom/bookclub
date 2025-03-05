import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import type { GoogleBooksResponse } from '@/types';

export async function GET(request: Request) {
	try {
		const user = await getAuthenticatedUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const query = searchParams.get('q');

		if (!query) {
			return NextResponse.json({ error: 'Query is required' }, { status: 400 });
		}

		// Add a timestamp to prevent caching
		const timestamp = new Date().getTime();
		const response = await fetch(
			`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
				query
			)}&maxResults=15&_t=${timestamp}`,
			{
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
					'Expires': '0'
				}
			}
		);

		if (!response.ok) {
			throw new Error('Failed to fetch books');
		}

		const data: GoogleBooksResponse = await response.json();

		const books = data.items?.map((item) => {
			return ({
				id: item.id,
				title: item.volumeInfo.title,
				subtitle: item.volumeInfo.subtitle,
				author: item.volumeInfo.authors?.[0] || 'Unknown Author',
				description: item.volumeInfo.description,
				imageUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail,
				pageCount: item.volumeInfo.pageCount,
				categories: item.volumeInfo.categories?.join(', '),
				textSnippet: item.searchInfo?.textSnippet,
				amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(
					`${item.volumeInfo.title} ${item.volumeInfo.authors?.[0] || ''}`
				)}&i=stripbooks`,
			})
		}) || [];

		// Return response with cache control headers
		return NextResponse.json(books, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('[BOOKS_SEARCH]', error);
		return NextResponse.json(
			{ error: 'Failed to search books' },
			{ status: 500 }
		);
	}
}