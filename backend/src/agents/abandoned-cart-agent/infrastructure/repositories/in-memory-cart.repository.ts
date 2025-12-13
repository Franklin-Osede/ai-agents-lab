import { Injectable, Logger } from '@nestjs/common';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { Cart, CartStatus } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/value-objects/cart-item.vo';

@Injectable()
export class InMemoryCartRepository implements ICartRepository {
  private readonly logger = new Logger(InMemoryCartRepository.name);
  private readonly carts: Map<string, Cart> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed abandoned carts for testing with proper CartItem objects
    const item1 = CartItem.create(
      'prod-1',
      'Smart Watch Blanco',
      1,
      450.0,
      'SW-001',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBUOb25zwg5CKzyvxKElkK-U6Y1RN0ReVS_0MAIcFkZAQgHz2OU8i2nB8LfcFUfkLBGTZrrzl174eL0Hr1QHdfl14xE8jIIqmTOtjCbuPmtAcV-vQ0m44LzIZYxHXbtTQPtJMJGQDTZ1FRqSZD81Yl0NQcODHfw4UnT7trg1T5por8RfWQmJ1TLmgTKOTzNH_PeweAD5KvYm0c6LXkf1XYLowrOP2Q9RieBipo4No83s8kUO45pYd90EmDE_giEGQEqNhdTjX4NopM',
    ).value;
    const item2 = CartItem.create(
      'prod-2',
      'Auriculares Inalámbricos',
      1,
      120.0,
      'HP-002',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBCKyxUPUfhorEJmMiBVguNO_Ug1_W2vvpyVty-vgbUriRlDA4-eFGFeLLfcsWpAUu-ofK9TVf-k0zDAkqDTkr2B8cEYjoinL5XmtBN5H2Hp7E54CwyM-i6WH4ui-j3PHb2bXn-Q5S_5zikC1pAXyg5aM7naVPjgZg-pZGWrUZXDxf3xIQpQspyfbKi-BIf5npJ7xtBXvjECqQr4XjEk5ZiuOAC8crEntQ5jGukP5ofQRwWB1sHu4vm1Nev0gLlY2a5D3Biqk34zqM',
    ).value;
    const item3 = CartItem.create(
      'prod-3',
      'Lente de Cámara',
      1,
      670.0,
      'LC-003',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4E7vtj1buiR582vECaOUjlgsn-yXQW3euBGqUXlu4MQJV7ytaUcj-hbSuOtCz9BHaSfO32y5joj1Mpb4-s6G04m50nxPEwVai6ZT3CY2ZgzPvHhP8mSfi1_3NZDqVZolvidFqw3xoxNDvgVSrSK7P10qx9pVDq_XfVmy5sVH52IHHVMv8Bz0V_VhKgTKiHMvTQ3Pnokp1XFw2GbGeRQ4GO3RqIqHcNXfeawkMqA-U5aLwFpdsGKi41L4UKtpxYRxnbin-0jhy9yo',
    ).value;
    const cart1 = Cart.create('cart-1', 'customer-1', 'demo-tenant', [item1, item2, item3]).value;
    cart1.markAsAbandoned();
    cart1.lastModifiedAt = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

    // High value cart
    const item4 = CartItem.create(
      'prod-4',
      'Bomba Industrial X200 de Alta Presión',
      2,
      500.0,
      'IND-2023-P',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDz7g5y5Wail2pGEapSoXhlgRNGTGXBL7K6HaE9QSOfdezWVa46IA0GOhDRtafqWE6hhRhuLE63sfB1yx-F1d9cnvlm4VT4SaCq9snvd1but-XQUYk2iVVbLWGsabSXCL58f0P6n7qvsyHDCNhXRfh5lCnszoBElbw7wZl6hHi3cxMRcJN7mBgwto5TMh2PRO0hlpJ5TZd5RXlZOisieE_EhqQuEKLGNQxTiuRbhh4kOpZ32VCdS6roFPC65RIo5g-Uc0yudDxeNCA',
    ).value;
    const item5 = CartItem.create(
      'prod-5',
      'Válvula de Seguridad de Cobre',
      1,
      250.0,
      'VLV-COP-99',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCOcqrTsns8RBwGQKsNDuxuvGe7M2p1mtnjFbzNFWqAGmiaytSCEInpznTkL4M38UY29G3UkCdK7UQ01thpTo_yejX-f_8okoA5sCvf7ybgQg5JPFTD6oOd87VU_OZ2zUrfvjVDfD2TW7zCmyUt4NSdexSvpN0ftuz67phjDsD9o5f6JWkmE7fdCxswAWJqqYAEx8JIPoyRUyQOun5eQKbBEfsr7rfoPhRCeNQiucjhn7IBiFZDX81jMroOUs-AvuH-VMsBruIBRpo',
    ).value;
    const cart2 = Cart.create('cart-2', 'customer-2', 'demo-tenant', [item4, item5]).value;
    cart2.markAsAbandoned();
    cart2.lastModifiedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    // Low value cart
    const item6 = CartItem.create(
      'prod-6',
      'Reloj Minimalista v2',
      1,
      89.99,
      'WM-2023-SL',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBS09iIG9VZluIDNjhwi3i0n6SVtkNGshLQ7mtzq77ymeLGLmC8kRia8AoJEokWJnJHtCWFQ1D8p5vnrcAT1SK5bAQJsgq8X7OyOV4o89AAORrkXPN7CGlFI_Pw1eVrhF0CjscyzdOWPJ3-JaxddqSFbnxrAVVmpj90xN3ROdGbMZ4KSL2e71rmp2fGYIl2O1m_i8zjfDSqHQXDQRWOGCFuKISVvE204wIQfHRb90CFcyOV2_SNqVqj8PZbX6CFzv2uwA91H-NGLik',
    ).value;
    const cart3 = Cart.create('cart-3', 'customer-3', 'demo-tenant', [item6]).value;
    cart3.markAsAbandoned();
    cart3.lastModifiedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    this.carts.set(cart1.id, cart1);
    this.carts.set(cart2.id, cart2);
    this.carts.set(cart3.id, cart3);

    this.logger.log('InMemoryCartRepository initialized with seed data');
  }

  async save(cart: Cart): Promise<void> {
    this.carts.set(cart.id, cart);
  }

  async findById(id: string): Promise<Cart | null> {
    return this.carts.get(id) || null;
  }

  async findAbandonedCarts(olderThanMinutes: number): Promise<Cart[]> {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    // If olderThanMinutes is 0, return all abandoned carts
    if (olderThanMinutes === 0) {
      return Array.from(this.carts.values()).filter((cart) => cart.status === CartStatus.ABANDONED);
    }

    return Array.from(this.carts.values()).filter(
      (cart) =>
        cart.status === CartStatus.ABANDONED &&
        cart.lastModifiedAt <= cutoffTime &&
        cart.recoveryAttempts === 0, // Don't spam
    );
  }
}
