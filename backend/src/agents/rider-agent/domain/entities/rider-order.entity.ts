import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RiderOrderStatus {
  PENDING = 'PENDING',
  MATCHING = 'MATCHING',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('rider_orders')
export class RiderOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // The user who requested the ride

  @Column({ nullable: true })
  driverId: string; // The assigned driver (initially null)

  // Pickup Location
  @Column('float')
  pickupLat: number;

  @Column('float')
  pickupLng: number;

  @Column()
  pickupAddress: string;

  // Dropoff Location
  @Column('float')
  dropoffLat: number;

  @Column('float')
  dropoffLng: number;

  @Column()
  dropoffAddress: string;

  // Ride Details
  @Column({
    type: 'enum',
    enum: RiderOrderStatus,
    default: RiderOrderStatus.PENDING,
  })
  status: RiderOrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  estimatedDurationRes: string; // JSON from Amazon Location

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
