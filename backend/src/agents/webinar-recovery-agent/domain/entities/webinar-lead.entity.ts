import { Result } from '../../../../core/domain/shared/value-objects/result';

export enum RecoveryStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  REBOOKED = 'REBOOKED',
  LOST = 'LOST',
}

export class WebinarLead {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly webinarId: string,
    public readonly attended: boolean,
    public status: RecoveryStatus,
    public readonly webinarTopic: string, // Context for AI
    public lastContactAt?: Date,
  ) {}

  static create(
    id: string,
    name: string,
    email: string,
    webinarId: string,
    attended: boolean,
    webinarTopic: string,
  ): Result<WebinarLead> {
    if (!email) {
      return Result.fail(new Error('Email is required'));
    }

    return Result.ok(
      new WebinarLead(id, name, email, webinarId, attended, RecoveryStatus.PENDING, webinarTopic),
    );
  }

  markAsContacted(): void {
    this.status = RecoveryStatus.CONTACTED;
    this.lastContactAt = new Date();
  }
}
