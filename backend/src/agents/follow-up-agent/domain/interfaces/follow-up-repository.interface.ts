import { FollowUp } from '../entities/follow-up.entity';

export interface IFollowUpRepository {
  save(followUp: FollowUp): Promise<FollowUp>;
  findById(id: string): Promise<FollowUp | null>;
  findByCustomerId(customerId: string): Promise<FollowUp[]>;
  findByBusinessId(businessId: string): Promise<FollowUp[]>;
  findPendingFollowUps(businessId: string): Promise<FollowUp[]>;
}
