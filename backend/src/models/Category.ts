import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Event } from './Event';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name: string = '';

  @Column({ nullable: true })
  icon: string = '';

  @Column({ default: 0 })
  sortOrder: number = 0;

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ nullable: true })
  description: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @OneToMany(() => Event, event => event.categoryEntity)
  events!: Event[];
}