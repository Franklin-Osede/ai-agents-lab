import { WebinarLead } from '../entities/webinar-lead.entity';

export interface IWebinarRepository {
  save(lead: WebinarLead): Promise<void>;
  findMissedAttendees(webinarId: string): Promise<WebinarLead[]>;
}
