import { Invoice } from '../entities/invoice.entity';

export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<void>;
  findOverdueInvoices(): Promise<Invoice[]>;
}
