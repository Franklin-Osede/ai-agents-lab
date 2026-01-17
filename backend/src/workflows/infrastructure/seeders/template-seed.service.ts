import { Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmTemplateRepository } from '../repositories/typeorm-template.repository';
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

    // Only seed if no templates exist
    if (existingTemplates.length === 0) {
      console.log('Seeding workflow templates...');

      await this.templateRepository.save(healthBasicTemplate);
      await this.templateRepository.save(restaurantBasicTemplate);

      console.log('✅ Templates seeded successfully');
    }
  }
}
