import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { assertTransition } from './order-status';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('One or more products are invalid');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalCents = 0;

    const lineItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }
      totalCents += product.priceCents * item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
      };
    });

    return this.prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          totalCents,
          items: { create: lineItems },
        },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async findAll(user: AuthUser, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where =
      user.role === Role.ADMIN ? {} : { userId: user.id };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(user: AuthUser, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Cannot access this order');
    }
    return order;
  }

  async updateStatus(user: AuthUser, id: string, status: OrderStatus) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can change order status');
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    assertTransition(order.status, status);

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } },
    });
  }
}
