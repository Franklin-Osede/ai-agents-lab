import { Injectable, Logger } from '@nestjs/common';
import { IInvoiceRepository } from '../../domain/interfaces/invoice-repository.interface';
import { Invoice, InvoiceStatus } from '../../domain/entities/invoice.entity';

@Injectable()
export class InMemoryInvoiceRepository implements IInvoiceRepository {
  private readonly logger = new Logger(InMemoryInvoiceRepository.name);
  private readonly invoices: Map<string, Invoice> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed an overdue invoice
    const inv1 = Invoice.create(
      'inv-101',
      'restaurant-client',
      5000,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Due 7 days ago
    ).value;
    inv1.markAsOverdue();

    this.invoices.set(inv1.id, inv1);

    this.logger.log('InMemoryInvoiceRepository initialized with seed data');
  }

  async save(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, invoice);
  }

  async findOverdueInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter((inv) => inv.status === InvoiceStatus.OVERDUE);
  }
}
