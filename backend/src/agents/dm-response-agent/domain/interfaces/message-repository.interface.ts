import { Message } from '../entities/message.entity';

export interface IMessageRepository {
  save(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByCustomerId(customerId: string): Promise<Message[]>;
  findByBusinessId(businessId: string): Promise<Message[]>;
}
