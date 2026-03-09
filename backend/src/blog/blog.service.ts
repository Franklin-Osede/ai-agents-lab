import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogPostStatus } from './entities/blog-post.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
  ) {}

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      uuidv4().split('-')[0]
    );
  }

  async create(createBlogPostDto: CreateBlogPostDto): Promise<BlogPost> {
    const post = this.blogRepository.create({
      ...createBlogPostDto,
      slug: this.generateSlug(createBlogPostDto.title),
    });
    return this.blogRepository.save(post);
  }

  async findAll(status?: BlogPostStatus): Promise<BlogPost[]> {
    const query = this.blogRepository.createQueryBuilder('post');
    if (status) {
      query.where('post.status = :status', { status });
    }
    return query.orderBy('post.createdAt', 'DESC').getMany();
  }

  async findOne(idOrSlug: string): Promise<BlogPost> {
    const post = await this.blogRepository.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
    });

    if (!post) {
      throw new NotFoundException(`Blog post with id or slug ${idOrSlug} not found`);
    }
    return post;
  }

  async update(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPost> {
    const post = await this.findOne(id);
    this.blogRepository.merge(post, updateBlogPostDto);
    return this.blogRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.blogRepository.remove(post);
  }
}
