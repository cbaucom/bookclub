const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

interface GoogleBookResponse {
	id: string;
	volumeInfo: {
		title: string;
		authors?: string[];
		description?: string;
		pageCount?: number;
		publishedDate?: string;
		imageLinks?: {
			thumbnail?: string;
		};
	};
}

export async function getBookDetails(bookId: string) {
	try {
		const response = await fetch(`${GOOGLE_BOOKS_API_URL}/${bookId}`);
		if (!response.ok) {
			throw new Error('Failed to fetch book details');
		}

		const data = (await response.json()) as GoogleBookResponse;
		return data.volumeInfo;
	} catch (error) {
		console.error('Error fetching book details:', error);
		return null;
	}
}