import { Controller, Post, Body } from '@nestjs/common';
import { IsString, IsUrl } from 'class-validator';
import { IngestWebsiteUseCase } from '../application/use-cases/ingest-website.use-case';

export class IngestWebDto {
  @IsUrl()
  url: string;

  @IsString()
  tenantId: string;
}

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly ingestUseCase: IngestWebsiteUseCase) {}

  @Post('ingest')
  async ingest(@Body() dto: IngestWebDto) {
    return this.ingestUseCase.execute(dto.url, dto.tenantId);
  }
}
