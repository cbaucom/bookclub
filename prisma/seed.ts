import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
	// Example: Create a group
	await prisma.group.create({
		data: {
			name: "Sci-Fi Lovers",
			description: "A group for sci-fi book enthusiasts",
			privacy: "PUBLIC",
		},
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
