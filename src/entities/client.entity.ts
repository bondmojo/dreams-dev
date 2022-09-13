import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
@Entity({ name: "clients", synchronize: true })
export class Client {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  first: string;

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

  @Column({ type: 'timestamp', nullable: true })
  dob: Date;

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

  @Column({ type: 'timestamp', nullable: true })
  acc_update_date: string;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: string;
};

