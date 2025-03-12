import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateMeetingRequest } from '@/types';
import { parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

// Simple validation function for meeting updates
function validateUpdateData(data: Record<string, unknown>): { valid: boolean; errors?: string[] } {
	const errors: string[] = [];

	if (data.title !== undefined) {
		if (typeof data.title !== 'string' || data.title.trim() === '') {
			errors.push('Title must be a non-empty string');
		}
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

	if (data.date !== undefined) {
		if (typeof data.date !== 'string' || isNaN(Date.parse(data.date as string))) {
			errors.push('Date must be a valid date string');
		}
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}

export async function GET(
	request: Request,
	context: { params: Promise<{ groupId: string; meetingId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, meetingId } = await context.params;

		if (!groupId || !meetingId) {
			return NextResponse.json(
				{ error: 'Invalid URL parameters' },
				{ status: 400 }
			);
		}

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

		// Get the meeting
		const meeting = await prisma.meeting.findUnique({
			where: {
				id: meetingId,
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
		});

		if (!meeting) {
			return NextResponse.json(
				{ error: 'Meeting not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(meeting);
	} catch (error) {
		console.error('Error fetching meeting:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch meeting' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	context: { params: Promise<{ groupId: string; meetingId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, meetingId } = await context.params;

		if (!groupId || !meetingId) {
			return NextResponse.json(
				{ error: 'Invalid URL parameters' },
				{ status: 400 }
			);
		}

		const body = await request.json();

		// Validate request body
		const validation = validateUpdateData(body);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: validation.errors },
				{ status: 400 }
			);
		}

		const data = body as UpdateMeetingRequest;

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
				{ error: 'Only admins can update meetings' },
				{ status: 403 }
			);
		}

		// Check if meeting exists
		const existingMeeting = await prisma.meeting.findUnique({
			where: {
				id: meetingId,
				groupId,
			},
		});

		if (!existingMeeting) {
			return NextResponse.json(
				{ error: 'Meeting not found' },
				{ status: 404 }
			);
		}

		// Update the meeting
		const updateData: Record<string, unknown> = {};
		if (data.title) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.location !== undefined) updateData.location = data.location;
		if (data.address !== undefined) updateData.address = data.address;
		if (data.date) {
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

			updateData.date = utcDate;
		}

		const updatedMeeting = await prisma.meeting.update({
			where: {
				id: meetingId,
			},
			data: updateData,
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

		return NextResponse.json(updatedMeeting);
	} catch (error) {
		console.error('Error updating meeting:', error);
		return NextResponse.json(
			{ error: 'Failed to update meeting' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ groupId: string; meetingId: string }> }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, meetingId } = await context.params;

		if (!groupId || !meetingId) {
			return NextResponse.json(
				{ error: 'Invalid URL parameters' },
				{ status: 400 }
			);
		}

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
				{ error: 'Only admins can delete meetings' },
				{ status: 403 }
			);
		}

		// Check if meeting exists
		const existingMeeting = await prisma.meeting.findUnique({
			where: {
				id: meetingId,
				groupId,
			},
		});

		if (!existingMeeting) {
			return NextResponse.json(
				{ error: 'Meeting not found' },
				{ status: 404 }
			);
		}

		// Delete the meeting
		await prisma.meeting.delete({
			where: {
				id: meetingId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting meeting:', error);
		return NextResponse.json(
			{ error: 'Failed to delete meeting' },
			{ status: 500 }
		);
	}
}