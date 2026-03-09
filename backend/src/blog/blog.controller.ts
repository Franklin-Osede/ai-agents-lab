import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlogPostStatus } from './entities/blog-post.entity';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'API for external agents to push drafts' })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  create(@Body() createBlogPostDto: CreateBlogPostDto) {
    return this.blogService.create(createBlogPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all published posts for the public site' })
  findAllPublished() {
    return this.blogService.findAll(BlogPostStatus.PUBLISHED);
  }

  @Get('drafts')
  @ApiOperation({ summary: 'Fetch all drafts to review' })
  findAllDrafts() {
    return this.blogService.findAll(BlogPostStatus.DRAFT);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Fetch a single post by ID or Slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.blogService.findOne(idOrSlug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post (e.g. to publish a draft)' })
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogService.update(id, updateBlogPostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
