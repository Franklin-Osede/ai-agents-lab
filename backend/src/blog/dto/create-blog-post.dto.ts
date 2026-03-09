import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlogPostStatus } from '../entities/blog-post.entity';

export class CreateBlogPostDto {
  @ApiProperty({ example: 'The Future of AI in Healthcare' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '<p>Content goes here...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'Agent.AI' })
  @IsString()
  @IsOptional()
  authorName?: string;

  @ApiPropertyOptional({ enum: BlogPostStatus, default: BlogPostStatus.DRAFT })
  @IsEnum(BlogPostStatus)
  @IsOptional()
  status?: BlogPostStatus;

  @ApiPropertyOptional({ example: 'AI in Healthcare - Complete Guide' })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'Learn how AI agents are transforming clinical bookings.' })
  @IsString()
  @IsOptional()
  seoDescription?: string;
}
