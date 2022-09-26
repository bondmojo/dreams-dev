import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
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
  outstanding_amount: number;

  @Column({ type: 'double', nullable: true })
  dream_point: number;

  @Column({ type: 'float', default: 0 })
  loan_fee: number;

  @Column({ nullable: true })
  wing_code: string;

  @Column({ type: 'float', default: 0 })
  wing_wei_luy_transfer_fee: number; // storing in DB bcz if the value change in future then it will lead to misscalculations.

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  disbursed_date: Date;

  @Column({ nullable: true })
  tenure_in_months: number;

  @Column({ type: 'date', nullable: true })
  repayment_date: Date;

  @CreateDateColumn()
  created_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_date: Date;

  @OneToMany(() => Transaction, transaction => transaction.loan)
  transaction: Transaction[]

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: Date;

};