import { Injectable, Logger } from '@nestjs/common';
import { IWebinarRepository } from '../../domain/interfaces/webinar-repository.interface';
import { WebinarLead, RecoveryStatus } from '../../domain/entities/webinar-lead.entity';

@Injectable()
export class InMemoryWebinarRepository implements IWebinarRepository {
  private readonly logger = new Logger(InMemoryWebinarRepository.name);
  private readonly leads: Map<string, WebinarLead> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed a lead who missed the webinar
    const lead1 = WebinarLead.create(
      'lead-1',
      'Sarah Jones',
      'sarah@example.com',
      'webinar-123',
      false, // missed
      'Dental Implants Q&A',
    ).value;

    this.leads.set(lead1.id, lead1);

    this.logger.log('InMemoryWebinarRepository initialized with seed data');
  }

  async save(lead: WebinarLead): Promise<void> {
    this.leads.set(lead.id, lead);
  }

  async findMissedAttendees(webinarId: string): Promise<WebinarLead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) =>
        lead.webinarId === webinarId && !lead.attended && lead.status === RecoveryStatus.PENDING,
    );
  }
}
