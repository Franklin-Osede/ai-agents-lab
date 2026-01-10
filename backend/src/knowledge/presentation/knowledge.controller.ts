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
}
