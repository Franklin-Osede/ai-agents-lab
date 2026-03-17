import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  ToolExecutor,
  ToolExecutionRequest,
  ToolExecutionResult,
} from '../../domain/tool-executor.interface';
import { DashboardEventsService } from '../dashboard/dashboard-events.service';

@Injectable()
export class MockToolExecutor implements ToolExecutor {
  constructor(
    @Optional()
    private readonly dashboardService?: DashboardEventsService,
  ) {}

  private emit(eventType: string, payload: any) {
    if (this.dashboardService) {
      // Broadcast to all connected dashboards for the demo
      this.dashboardService.emitEvent('broadcast', eventType, payload);
    }
  }

  private emitThought(step: string, details: string) {
    this.emit('thought_process', { step, details, timestamp: new Date().toISOString() });
  }

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const { toolName, context } = request;
    const niche = context?.niche || 'generic';

    console.log(`[MockToolExecutor] Executing ${toolName} for niche: ${niche}`);

    let result: ToolExecutionResult = { success: false, error: 'Tool not found' };

    switch (niche) {
      case 'restaurant':
        result = this.handleRestaurantTools(toolName, request.arguments);
        break;
      case 'dental':
        result = this.handleDentalTools(toolName, request.arguments);
        break;
      case 'legal':
        result = this.handleLegalTools(toolName, request.arguments);
        break;
      default:
        break;
    }

    // Fallback to generic tools if not found in niche
    if (!result.success && result.error?.includes('not found')) {
      result = this.handleGenericTools(toolName, request.arguments);
    }

    return result;
  }

  private handleGenericTools(tool: string, args: any): ToolExecutionResult {
    if (tool === 'search_web') {
      this.emitThought('searching_web', `Query: "${args.query}"`);

      // Simulate network delay for effect
      // In a real app we might use setTimeout, but for sync returns we just simulate the data.

      let snippet = 'Information not available.';
      if (args.query.includes('pain') || args.query.includes('dolor')) {
        snippet =
          'Source: WebMD. Most dental implants strictly involve minor discomfort treated with over-the-counter pain medication. Local anesthesia is used.';
      } else if (args.query.includes('wash') || args.query.includes('lavar')) {
        snippet =
          'Source: Glossier Blog. Wait at least 48-72 hours after keratin treatment before washing hair to allow the treatment to set.';
      } else if (args.query.includes('divorce') || args.query.includes('divorcio')) {
        snippet =
          'Source: Gov.uk. You can get divorced if you’ve been married for at least a year and your relationship has permanently broken down.';
      }

      this.emitThought('found_result', `Found highly relevant article from trusted source.`);

      return {
        success: true,
        data: {
          results: [
            {
              title: 'Best Practice Guide',
              snippet: snippet,
              url: 'https://trusted-source.com/info',
            },
          ],
        },
      };
    }
    return { success: false, error: `Tool ${tool} not found` };
  }

  private handleRestaurantTools(tool: string, args: any): ToolExecutionResult {
    if (tool === 'check_availability') {
      this.emitThought('checking_data', 'Querying Restaurant Reservation System (KDS)...');
      // Simulate fully booked at 21:00, available at 21:30
      if (args.time === '21:00') {
        this.emit('restaurant_availability_checked', { time: '21:00', available: false });
        return {
          success: true,
          data: { available: false, suggestion: '21:30', reason: 'Fully booked' },
        };
      }
      this.emit('restaurant_availability_checked', { time: args.time, available: true });
      return { success: true, data: { available: true } };
    }
    if (tool === 'get_menu') {
      this.emit('restaurant_menu_viewed', {});
      return {
        success: true,
        data: {
          specials: ['Lubina a la sal', 'Chuletón de Ávila'],
          out_of_stock: ['Langosta'],
        },
      };
    }
    return { success: false, error: `Tool ${tool} not found for restaurant` };
  }

  private handleDentalTools(tool: string, args: any): ToolExecutionResult {
    if (tool === 'check_patient_history') {
      this.emitThought('checking_data', 'Securely accessing Patient Record System (EHR)...');
      const exists = args.name?.toLowerCase().includes('juan');
      this.emit('dental_patient_lookup', { name: args.name, found: exists });

      if (exists) {
        return {
          success: true,
          data: {
            exists: true,
            last_visit: '2025-09-15',
            treatment: 'Implante',
            due_for_revision: true,
          },
        };
      }
      return { success: true, data: { exists: false } };
    }
    if (tool === 'check_insurance') {
      this.emitThought('checking_data', 'Validating policy with Insurance Provider API...');
      this.emit('dental_insurance_verified', { status: 'active', coverage: '80%' });
      return {
        success: true,
        data: {
          covered: true,
          coverage_percent: 80,
          copay: 10,
        },
      };
    }
    return { success: false, error: `Tool ${tool} not found for dental` };
  }

  private handleLegalTools(tool: string, args: any): ToolExecutionResult {
    if (tool === 'upload_document') {
      this.emitThought('processing_upload', 'Scanning and classifying document...');
      this.emit('legal_document_uploaded', { filename: args.filename, category: args.category });
      return {
        success: true,
        data: {
          status: 'uploaded',
          path: `/Client_Files/${args.category}/${args.filename}`,
          timestamp: new Date().toISOString(),
        },
      };
    }
    if (tool === 'check_file_status') {
      this.emit('legal_status_checked', { status: 'pending_review' });
      return {
        success: true,
        data: { status: 'pending_review', missing_docs: ['DNI', 'Factura Luz'] },
      };
    }
    return { success: false, error: `Tool ${tool} not found for legal` };
  }
}
