import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';

import { Client } from "../../client/entities/client.entity";
import { Transaction } from '../../transaction/entities/transaction.entity';

@Entity({ name: "loans" })
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

  @Column({ nullable: true, default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  wire_transfer_type: string

  @Column({ type: 'double', nullable: true })
  dream_point: number;

  @Column({ type: 'float', default: 0 })
  loan_fee: number;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  disbursed_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  repayment_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_date: Date;

  @Column({ nullable: true })
  tenure_in_months: number;

  @OneToMany(() => Transaction, transaction => transaction.loan)
  transaction: Transaction[]

  @CreateDateColumn()
  created_at: string;
};

