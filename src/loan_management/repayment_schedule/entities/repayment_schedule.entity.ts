import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { Client } from '../../client/entities/client.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';

@Entity({ name: "loan_repayment_schedule" })
export class RepaymentSchedule {
  @PrimaryColumn()
  id: string;

  @Column()
  ins_number: number;

  @Column()
  loan_id: string;

  @ManyToOne(() => Loan, loan => loan.repayment_schedule)
  @JoinColumn({ name: 'loan_id', referencedColumnName: 'id' })
  loan: Loan;

  @Column()
  client_id: string;

  @ManyToOne(() => Client, client => client.repayment_schedule)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  client: Client;

  @OneToMany(() => Transaction, transaction => transaction.repayment_schedule)
  transaction: Transaction[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ins_overdue_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ins_principal_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 3 })
  ins_membership_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ins_additional_fee: number; // it's late fee 

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_paid_amount: number;

  @Column()
  repayment_status: string;

  @Column()
  scheduling_status: string;

  @Column({ type: 'int' })
  grace_period: number;

  @Column({ type: 'int', default: 0, unsigned: true })
  number_of_penalties: number;

  @Column({ type: "json", nullable: true })
  previous_repayment_dates: object[];

  @Column({ type: 'date' })
  ins_from_date: Date;

  @Column({ type: 'date' })
  ins_to_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  paid_date: Date;

  @Column({ nullable: true })
  zoho_loan_id: string;

  @Column({ nullable: true })
  zoho_repayment_schedule_id: string;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: string;

  @Column({ nullable: true, default: 'USD' })
  currency: string;
};

