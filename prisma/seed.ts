import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@orderflow.dev' },
    update: {},
    create: {
      email: 'admin@orderflow.dev',
      name: 'OrderFlow Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const customerHash = await bcrypt.hash('Customer123!', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@orderflow.dev' },
    update: {},
    create: {
      email: 'customer@orderflow.dev',
      name: 'Demo Customer',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
    },
  });

  const products = [
    {
      name: 'Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones',
      priceCents: 12999,
      stock: 50,
    },
    {
      name: 'USB-C Hub',
      description: '7-in-1 multiport adapter',
      priceCents: 4999,
      stock: 120,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'Hot-swappable tactile switches',
      priceCents: 15999,
      stock: 35,
    },
    {
      name: '27-inch Monitor',
      description: '1440p IPS display, 144Hz',
      priceCents: 29999,
      stock: 20,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    if (!existing) {
      await prisma.product.create({ data: product });
    }
  }

  console.log('Seed complete:', { admin: admin.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
