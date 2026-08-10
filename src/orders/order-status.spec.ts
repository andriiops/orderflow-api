import { OrderStatus } from '@prisma/client';
import {
  assertTransition,
  canTransition,
  getAllowedTransitions,
} from './order-status';

describe('order status transitions', () => {
  it('allows PENDING → PAID and PENDING → CANCELLED', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.PAID)).toBe(true);
    expect(canTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(
      true,
    );
    expect(canTransition(OrderStatus.PENDING, OrderStatus.SHIPPED)).toBe(
      false,
    );
  });

  it('allows PAID → SHIPPED and blocks PAID → DELIVERED', () => {
    expect(canTransition(OrderStatus.PAID, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransition(OrderStatus.PAID, OrderStatus.DELIVERED)).toBe(false);
  });

  it('allows SHIPPED → DELIVERED only', () => {
    expect(getAllowedTransitions(OrderStatus.SHIPPED)).toEqual([
      OrderStatus.DELIVERED,
    ]);
  });

  it('treats DELIVERED and CANCELLED as terminal', () => {
    expect(getAllowedTransitions(OrderStatus.DELIVERED)).toEqual([]);
    expect(getAllowedTransitions(OrderStatus.CANCELLED)).toEqual([]);
  });

  it('throws on invalid transition', () => {
    expect(() =>
      assertTransition(OrderStatus.PENDING, OrderStatus.DELIVERED),
    ).toThrow('Invalid status transition');
  });

  it('throws when status is unchanged', () => {
    expect(() =>
      assertTransition(OrderStatus.PAID, OrderStatus.PAID),
    ).toThrow('already PAID');
  });
});
