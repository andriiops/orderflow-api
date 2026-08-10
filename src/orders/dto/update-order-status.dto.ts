import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PAID,
    description: 'Next status. Flow: PENDING → PAID → SHIPPED → DELIVERED (or CANCELLED from PENDING/PAID)',
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
