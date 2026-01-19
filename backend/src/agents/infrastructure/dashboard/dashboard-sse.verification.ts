import { Test } from '@nestjs/testing';
import { DashboardEventsService } from './dashboard-events.service';
import { DashboardController } from '../../interface/dashboard.controller';
import { MockToolExecutor } from '../tools/mock-tool-executor';
import { Response } from 'express';

// Mock Express Response
class MockResponse {
  headers: Record<string, string> = {};
  data: string[] = [];

  setHeader(key: string, value: string) {
    this.headers[key] = value;
  }
  flushHeaders() {}
  write(chunk: string) {
    this.data.push(chunk);
    console.log('[SSE Output]:', chunk.trim());
  }
  on(event: string, cb: () => void) {}
  end() {}
}

async function verifySSE() {
  console.log('--- Starting SSE Verification ---');

  const eventsService = new DashboardEventsService();
  const controller = new DashboardController(eventsService);
  const toolExecutor = new MockToolExecutor(eventsService);

  // 1. Simulate Client Connection
  const mockRes = new MockResponse() as unknown as Response;
  console.log('1. Client subscribing...');
  controller.subscribeToEvents('client-1', mockRes);

  // 2. Execute a Tool (Restaurant)
  console.log('\n2. Executing Tool (Restaurant Check)...');
  await toolExecutor.execute({
    toolName: 'check_availability',
    arguments: { time: '21:00' },
    context: { niche: 'restaurant' },
  });

  // 3. Execute a Tool (Dental)
  console.log('\n3. Executing Tool (Dental Patient Check)...');
  await toolExecutor.execute({
    toolName: 'check_patient_history',
    arguments: { name: 'Juan Perez' },
    context: { niche: 'dental' },
  });

  // 4. Execute a Tool (Hybrid Knowledge / Web Search)
  console.log('\n4. Executing Tool (Web Search - Hybrid Knowledge)...');
  await toolExecutor.execute({
    toolName: 'search_web',
    arguments: { query: 'Is dental implant painful/dolor?' },
    context: { niche: 'dental' }, // Even in niche, it falls back to generic
  });

  console.log('\n--- Verification Complete ---');
}

verifySSE().catch(console.error);
