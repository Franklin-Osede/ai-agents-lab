import { Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmTemplateRepository } from '../repositories/typeorm-template.repository';
import { dentalBasicTemplate } from '../templates/dental-basic.template';
import { healthBasicTemplate } from '../templates/health-basic.template';
import { restaurantBasicTemplate } from '../templates/restaurant-basic.template';

@Injectable()
export class TemplateSeedService implements OnModuleInit {
  constructor(private readonly templateRepository: TypeOrmTemplateRepository) {}

  async onModuleInit() {
    await this.seedTemplates();
  }

  private async seedTemplates() {
    const existingTemplates = await this.templateRepository.findAll();

    // Check if "dental" exists by checking the type property
    const dentalExists = existingTemplates.some((t) => t.niche.type === 'dental');

    if (existingTemplates.length === 0 || !dentalExists) {
      console.log('Seeding workflow templates...');

      if (!existingTemplates.some((t) => t.niche.type === 'health')) {
        await this.templateRepository.save(healthBasicTemplate);
      }
      if (!existingTemplates.some((t) => t.niche.type === 'restaurant')) {
        await this.templateRepository.save(restaurantBasicTemplate);
      }
      if (!dentalExists) {
        await this.templateRepository.save(dentalBasicTemplate);
      }

      console.log('✅ Templates seeded successfully');
    }
  }
}
