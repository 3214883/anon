import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Wallet } from './Wallet';

@Entity()
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column()
  walletId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column()
  type!: string; // deposit: 充值, payment: 消费, refund: 退款, system: 系统赠送, settlement: 活动结算

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'completed' })
  status!: string;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ nullable: true })
  relatedId?: number; // 关联的支付ID或报名ID

  @CreateDateColumn()
  createdAt!: Date;
}