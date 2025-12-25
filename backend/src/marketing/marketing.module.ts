import { Module } from '@nestjs/common';
import { LeadCaptureController } from './lead-capture.controller';
import { LeadCaptureService } from './lead-capture.service';
import { EmailService } from './email.service';
import { SecurityModule } from '../core/security/security.module';

/**
 * Marketing Module
 *
 * Handles lead capture, email marketing, follow-ups, etc.
 */
@Module({
  imports: [SecurityModule],
  controllers: [LeadCaptureController],
  providers: [LeadCaptureService, EmailService],
  exports: [LeadCaptureService, EmailService],
})
export class MarketingModule {}

