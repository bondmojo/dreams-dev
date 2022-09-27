import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Loan } from "../../loan/entities/loan.entity";

@Entity({ name: "transactions" })
export class Transaction {
  @PrimaryColumn()
  id: string;

  @Column()
  loan_id: string;

  @ManyToOne(() => Loan, loan => loan.transaction)
  @JoinColumn({ name: 'loan_id', referencedColumnName: 'id' })
  loan: Loan[];

  @Column({ type: 'double', nullable: true })
  amount: number;

  @Column({ nullable: true, default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: string;
};

