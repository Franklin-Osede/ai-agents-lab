import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { IWebinarRepository } from '../../domain/interfaces/webinar-repository.interface';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { VoiceChannel } from '../../../voice-agent/domain/value-objects/voice-message';
import { WebinarLead } from '../../domain/entities/webinar-lead.entity';

@Injectable()
export class WebinarRecoveryService {
  private readonly logger = new Logger(WebinarRecoveryService.name);

  constructor(
    @Inject('IWebinarRepository') private readonly webinarRepository: IWebinarRepository,
    private readonly voiceAgentService: VoiceAgentService,
  ) {}

  async processRecovery(webinarId: string): Promise<Result<string>> {
    try {
      const leads = await this.webinarRepository.findMissedAttendees(webinarId);

      if (leads.length === 0) {
        return Result.ok('No pending recovery leads found for this webinar.');
      }

      this.logger.log(
        `Found ${leads.length} missed attendees for webinar ${webinarId}. Starting recovery...`,
      );

      for (const lead of leads) {
        await this.recoverLead(lead);
      }

      return Result.ok(`Processed ${leads.length} leads`);
    } catch (error) {
      this.logger.error(`Failed to process webinar recovery: ${(error as Error).message}`);
      return Result.fail(error as Error);
    }
  }

  private async recoverLead(lead: WebinarLead): Promise<void> {
    this.logger.log(`Generating recovery video for ${lead.name}`);

    // Context for AI
    const context = `
      Topic: ${lead.webinarTopic}.
      User Name: ${lead.name}.
      Goal: Sorry you missed it. Here is a summary.
      Call to Action: Book a free scan.
    `;

    // Agent-to-Agent call with VIDEO enabled
    const voiceResult = await this.voiceAgentService.generateVoiceMessage({
      customerId: lead.id, // Using lead ID as customer ID
      businessId: 'dental-clinic',
      context,
      channel: VoiceChannel.WHATSAPP, // or EMAIL if we supported it
      includeVideo: true, // This enables the Avatar (D-ID)
    });

    if (voiceResult.isSuccess) {
      this.logger.log(`Recovery video generated for ${lead.name}: ${voiceResult.value.audioUrl}`);

      lead.markAsContacted();
      await this.webinarRepository.save(lead);
    } else {
      this.logger.error(`Failed to generate video for ${lead.name}: ${voiceResult.error}`);
    }
  }
}
