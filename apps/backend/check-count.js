import prisma from './src/lib/prisma.js'; const count = await prisma.fountainApplicant.count(); console.log('Count:', count); process.exit(0);
