import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
	const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
	}

	// Get the headers from the request directly
	const svix_id = req.headers.get('svix-id');
	const svix_timestamp = req.headers.get('svix-timestamp');
	const svix_signature = req.headers.get('svix-signature');

	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response('Error occured -- no svix headers', {
			status: 400,
		});
	}

	// Get the body
	const payload = await req.json();
	const evt = payload as WebhookEvent;

	const eventType = evt.type;

	if (eventType === 'user.created' || eventType === 'user.updated') {
		const { id, first_name, last_name, email_addresses, image_url } = evt.data;

		const primaryEmail = email_addresses?.[0]?.email_address;

		if (!primaryEmail) {
			return new Response('No email found', { status: 400 });
		}

		try {
			await prisma.user.upsert({
				where: { clerkId: id as string },
				create: {
					clerkId: id as string,
					email: primaryEmail,
					firstName: first_name || null,
					lastName: last_name || null,
					imageUrl: image_url || null,
				},
				update: {
					email: primaryEmail,
					firstName: first_name || null,
					lastName: last_name || null,
					imageUrl: image_url || null,
				},
			});

			return NextResponse.json({ message: 'User updated' }, { status: 200 });
		} catch (error) {
			console.error('Error upserting user:', error);
			return NextResponse.json(
				{ error: 'Error upserting user' },
				{ status: 500 }
			);
		}
	}

	return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
}
