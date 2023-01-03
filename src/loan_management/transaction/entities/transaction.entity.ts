import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Loan } from "../../loan/entities/loan.entity";
import { RepaymentSchedule } from "../../repayment_schedule/entities/repayment_schedule.entity";
@Entity({ name: "transactions" })
export class Transaction {
  @PrimaryColumn()
  id: string;

  @Column()
  loan_id: string;

  @ManyToOne(() => Loan, loan => loan.transaction)
  @JoinColumn({ name: 'loan_id', referencedColumnName: 'id' })
  loan: Loan[];

  @Column()
  repayment_schedule_id: string;

  @ManyToOne(() => RepaymentSchedule, repayment_schedule => repayment_schedule.transaction)
  @JoinColumn({ name: 'repayment_schedule_id' })
  repayment_schedule: RepaymentSchedule;

  @Column({ type: 'double', nullable: true })
  amount: number;

  @Column({ nullable: true, default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn()
  created_at: string;
};

