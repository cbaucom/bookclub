import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MeetingResponseRequest } from '@/types';

// Simple validation function for meeting response
function validateResponseData(data: MeetingResponseRequest): { valid: boolean; errors?: string[] } {
	const errors: string[] = [];

	if (!data.status) {
		errors.push('Status is required');
	} else if (!['YES', 'NO', 'MAYBE'].includes(data.status)) {
		errors.push('Status must be one of: YES, NO, MAYBE');
	}

	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}

export async function POST(
	req: NextRequest,
	{ params }: { params: { groupId: string; meetingId: string } }
) {
	try {
		const user = await getAuthenticatedUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { groupId, meetingId } = params;
		const body = await req.json();

		// Validate request body
		const validation = validateResponseData(body);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: validation.errors },
				{ status: 400 }
			);
		}

		const data = body as MeetingResponseRequest;

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

		// Check if meeting exists
		const meeting = await prisma.meeting.findUnique({
			where: {
				id: meetingId,
				groupId,
			},
		});

		if (!meeting) {
			return NextResponse.json(
				{ error: 'Meeting not found' },
				{ status: 404 }
			);
		}

		// Create or update the response
		const response = await prisma.meetingResponse.upsert({
			where: {
				userId_meetingId: {
					userId: user.id,
					meetingId,
				},
			},
			update: {
				status: data.status,
			},
			create: {
				userId: user.id,
				meetingId,
				status: data.status,
			},
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
		});

		return NextResponse.json(response);
	} catch (error) {
		console.error('Error responding to meeting:', error);
		return NextResponse.json(
			{ error: 'Failed to respond to meeting' },
			{ status: 500 }
		);
	}
}