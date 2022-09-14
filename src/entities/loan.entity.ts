import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Client } from "./client.entity";

@Entity({ name: "loans", synchronize: true })
export class Loan {
  @PrimaryColumn()
  id: string;

  @Column()
  client_id: string;

  @ManyToOne(() => Client, client => client.loan)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  client: Client[];

  @Column({ type: 'double', nullable: true })
  amount: number;

  @Column({ type: 'double', nullable: true })
  dream_point: number;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  created_date: string;

  @Column({ type: 'timestamp', nullable: true })
  disbursed_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_date: Date;

  @Column({ nullable: true })
  tenure_in_months: number;

};

