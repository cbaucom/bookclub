import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateMeetingRequest } from '@/types';
import { parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

// Simple validation function for meeting creation
function validateMeetingData(data: CreateMeetingRequest): { valid: boolean; errors?: string[] } {
	const errors: string[] = [];

	if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
		errors.push('Title is required');
	}

	if (data.description !== undefined && typeof data.description !== 'string') {
		errors.push('Description must be a string');
	}

	if (data.location !== undefined && typeof data.location !== 'string') {
		errors.push('Location must be a string');
	}

	if (data.address !== undefined && typeof data.address !== 'string') {
		errors.push('Address must be a string');
	}

	if (!data.date || isNaN(Date.parse(data.date))) {
		errors.push('Valid date is required');
	}

	if (!data.groupId || typeof data.groupId !== 'string') {
		errors.push('Group ID is required');
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId } = await context.params;

		// Check if user is a member of the group
		const membership = await prisma.membership.findUnique({
			where: {
				userId_groupId: {
					userId: user.id,
					groupId,
				},
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'You are not a member of this group' },
				{ status: 403 }
			);
		}

		// Get all meetings for the group
		const meetings = await prisma.meeting.findMany({
			where: {
				groupId,
			},
			include: {
				createdBy: {
					select: {
						firstName: true,
						lastName: true,
						clerkId: true,
						imageUrl: true,
						username: true,
					},
				},
				responses: {
					include: {
						user: {
							select: {
								firstName: true,
								lastName: true,
								clerkId: true,
								imageUrl: true,
								username: true,
							},
						},
					},
				},
				_count: {
					select: {
						responses: true,
					},
				},
			},
			orderBy: {
				date: 'asc',
			},
		});

		return NextResponse.json(meetings);
	} catch (error) {
		console.error('Error fetching meetings:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch meetings' },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: Request,
	context: { params: Promise<{ groupId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId } = await context.params;

		const body = await request.json();

		// Validate request body
		const validation = validateMeetingData({ ...body, groupId });
		if (!validation.valid) {
			return NextResponse.json(
				{ error: validation.errors },
				{ status: 400 }
			);
		}

		const data = body as CreateMeetingRequest;

		// Check if user is an admin of the group
		const membership = await prisma.membership.findUnique({
			where: {
				userId_groupId: {
					userId: user.id,
					groupId,
				},
			},
		});

		if (!membership) {
			return NextResponse.json(
				{ error: 'You are not a member of this group' },
				{ status: 403 }
			);
		}

		if (membership.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'Only admins can create meetings' },
				{ status: 403 }
			);
		}

		// Create the meeting
		// Parse the local date string from the form
		const localDate = parseISO(data.date);

		// Use the client's timezone if provided, otherwise fall back to server timezone
		const timeZone = data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

		// Convert from local timezone to UTC
		// This treats the input date as being in the user's timezone
		// and converts it to the equivalent UTC time
		const utcDate = fromZonedTime(localDate, timeZone);

		console.log('Original date input:', data.date);
		console.log('Client timezone:', timeZone);
		console.log('Converted to UTC:', utcDate.toISOString());

		const meeting = await prisma.meeting.create({
			data: {
				title: data.title,
				description: data.description,
				location: data.location,
				address: data.address,
				date: utcDate,
				groupId,
				createdById: user.id,
			},
			include: {
				createdBy: {
					select: {
						firstName: true,
						lastName: true,
						clerkId: true,
						imageUrl: true,
						username: true,
					},
				},
			},
		});

		return NextResponse.json(meeting);
	} catch (error) {
		console.error('Error creating meeting:', error);
		return NextResponse.json(
			{ error: 'Failed to create meeting' },
			{ status: 500 }
		);
	}
}