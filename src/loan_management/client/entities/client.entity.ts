import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
@Entity({ name: "clients" })
export class Client {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  first: string;

  @Column({ nullable: true })
  migration_test: string;

  @OneToMany(() => Loan, loan => loan.client)
  loan: Loan

  @Column({ nullable: true })
  zoho_id: string;

  @Column({ nullable: true })
  sendpulse_id: string;

  @Column({ nullable: true })
  last: string;

  @Column({ nullable: true })
  full_en: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ type: 'double', default: 0 })
  dream_points_earned: number;

  @Column({ type: 'double', default: 0 })
  dream_points_committed: number;

  @Column({ type: 'timestamp', nullable: true })
  dob: Date;

  @Column({ default: 1 })
  tier: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  acc_provider_type: string;

  @Column({ nullable: true })
  acc_number: string;

  @Column({ nullable: true })
  acc_note: string;

  @Column({ nullable: true, default: 1 })
  summary_loanCycle: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
  summary_has_loan_in_arrear: string;

  @Column({ nullable: true, default: 50 })
  summary_membership_level: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  village: string;

  @Column({ nullable: true })
  commune: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  national_id: string;

  @Column({ type: 'timestamp', nullable: true })
  acc_update_date: string;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: string;
};

