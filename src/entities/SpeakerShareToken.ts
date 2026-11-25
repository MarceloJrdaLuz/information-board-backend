import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Congregation } from "./Congregation";
import { User } from "./User";

@Entity("speaker_share_tokens")
export class SpeakerShareToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", unique: true })
  token: string;

  @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "congregation_id" })
  congregation: Congregation;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @Column({ type: "timestamp with time zone" })
  expires_at: Date;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at: Date;
}
