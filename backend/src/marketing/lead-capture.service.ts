import { Injectable, Logger } from '@nestjs/common';
import { ApiKeyService } from '../core/security/api-key.service';
import { Tenant } from '../core/security/tenant.entity';

/**
 * Lead Capture Service
 * 
 * Handles lead capture, trial management, and conversion tracking
 */
@Injectable()
export class LeadCaptureService {
  private readonly logger = new Logger(LeadCaptureService.name);
  
  // In-memory storage (replace with database in production)
  private leads: Map<string, Lead> = new Map();
  
  constructor(private readonly apiKeyService: ApiKeyService) {}
  
  /**
   * Capture lead from demo and create trial account
   */
  async captureLead(data: {
    email: string;
    name: string;
    agentId?: string;
    source?: string;
  }): Promise<{
    success: boolean;
    apiKey?: string;
    tenantId: string;
    trialEndsAt: Date;
    error?: string;
  }> {
    try {
      this.logger.log(`Capturing lead: ${data.email}`);
      
      // Check if lead already exists
      const existingLead = Array.from(this.leads.values()).find(
        l => l.email === data.email && l.status === 'active'
      );
      
      if (existingLead) {
        this.logger.log(`Lead ${data.email} already exists and is active`);
        return {
          success: true,
          tenantId: existingLead.tenantId,
          trialEndsAt: existingLead.trialEndsAt,
        };
      }
      
      // Create tenant
      const tenant = this.apiKeyService.createTestTenant(data.name, []);
      
      // Generate API key
      const { apiKey, apiKeyEntity } = await this.apiKeyService.generateApiKey(
        tenant.id,
        ['*'], // All scopes for trial
        100, // 100 requests/hour for trial
      );
      
      // Calculate trial end date (14 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      
      // Create lead record
      const lead: Lead = {
        id: this.generateId(),
        email: data.email,
        name: data.name,
        agentId: data.agentId,
        source: data.source || 'demo',
        status: 'trial',
        apiKeyId: apiKeyEntity.id,
        tenantId: tenant.id,
        trialStartedAt: new Date(),
        trialEndsAt,
        convertedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      this.leads.set(lead.id, lead);
      
      this.logger.log(`Lead captured: ${data.email}, trial ends: ${trialEndsAt.toISOString()}`);
      
      // TODO: Send welcome email
      // TODO: Schedule follow-ups
      
      return {
        success: true,
        apiKey, // Only shown once
        tenantId: tenant.id,
        trialEndsAt,
      };
    } catch (error) {
      this.logger.error('Error capturing lead:', error);
      return {
        success: false,
        tenantId: '',
        trialEndsAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get lead by email
   */
  getLeadByEmail(email: string): Lead | null {
    return Array.from(this.leads.values()).find(l => l.email === email) || null;
  }
  
  /**
   * Get leads needing follow-up
   */
  getLeadsNeedingFollowUp(): Lead[] {
    const now = new Date();
    return Array.from(this.leads.values()).filter(lead => {
      if (lead.status !== 'trial') return false;
      
      const daysSinceStart = this.getDaysSince(lead.trialStartedAt);
      // Need follow-up on days 3, 7, 10, 14
      return [3, 7, 10, 14].includes(daysSinceStart);
    });
  }
  
  /**
   * Mark lead as converted (paid customer)
   */
  async markAsConverted(leadId: string): Promise<void> {
    const lead = this.leads.get(leadId);
    if (lead) {
      lead.status = 'active';
      lead.convertedAt = new Date();
      lead.updatedAt = new Date();
      this.leads.set(leadId, lead);
    }
  }
  
  private generateId(): string {
    return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

interface Lead {
  id: string;
  email: string;
  name: string;
  agentId?: string;
  source: string;
  status: 'trial' | 'active' | 'churned';
  apiKeyId: string;
  tenantId: string;
  trialStartedAt: Date;
  trialEndsAt: Date;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
