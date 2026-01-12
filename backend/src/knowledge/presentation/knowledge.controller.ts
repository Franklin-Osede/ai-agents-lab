import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { IsString, IsUrl } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IngestWebsiteUseCase } from '../application/use-cases/ingest-website.use-case';
import { GetOrganizationInfoUseCase } from '../application/use-cases/get-organization-info.use-case';

export class IngestWebDto {
  @ApiProperty({ example: 'https://example.com', description: 'URL of the website to ingest' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: 'tenant-123', description: 'ID of the tenant' })
  @IsString()
  tenantId: string;
}

export class ClassifyIntentDto {
  @ApiProperty({ example: 'Me duele la rodilla', description: 'User spoken text' })
  @IsString()
  text: string;

  @ApiProperty({
    example: [{ intentName: 'Sintoma', keywords: ['dolor', 'molestia'] }],
    description: 'List of intents to match against',
  })
  intents: { intentName: string; keywords?: string[] }[];
}

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly ingestUseCase: IngestWebsiteUseCase,
    private readonly getInfoUseCase: GetOrganizationInfoUseCase,
  ) {}

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest a website for knowledge extraction' })
  @ApiResponse({ status: 201, description: 'Website ingestion started successfully' })
  async ingest(@Body() dto: IngestWebDto) {
    return this.ingestUseCase.execute(dto.url, dto.tenantId);
  }

  @Get('organization-info/:tenantId')
  @ApiOperation({ summary: 'Get organization info (services, team) for a tenant' })
  @ApiResponse({ status: 200, description: 'Organization info retrieved successfully' })
  async getOrganizationInfo(@Param('tenantId') tenantId: string) {
    return this.getInfoUseCase.execute(tenantId);
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify user text into one of the provided intents' })
  @ApiResponse({ status: 200, description: 'Best matching intent' })
  async classify(@Body() dto: ClassifyIntentDto) {
    // MOCK IMPLEMENTATION (Simple Keyword Matcher)
    // TODO: Connect to LLM
    const text = dto.text.toLowerCase();

    // Default to first intent if no match
    let bestMatch = dto.intents[0]?.intentName || 'Unknown';
    let maxScore = 0;

    for (const intent of dto.intents) {
      if (!intent.keywords || intent.keywords.length === 0) continue;

      // Count matches
      let score = 0;
      for (const keyword of intent.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      }

      // Exact match bonus
      if (text.includes(intent.intentName.toLowerCase())) score += 10;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = intent.intentName;
      }
    }

    console.log(`[Classify] Text: "${dto.text}" -> Matched: "${bestMatch}" (Score: ${maxScore})`);
    return { intentName: bestMatch };
  }
}
