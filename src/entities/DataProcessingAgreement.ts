import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { User } from "./User"
import { TermsOfUse } from "./TermsOfUse"
import { Publisher } from "./Publisher"

@Entity("data_processing_agreements")
export class DataProcessingAgreement {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 50 })
  type: "congregation" | "publisher"

  @Column({ type: "varchar", length: 10 })
  version: string

  @Column({ type: "text" })
  content_snapshot: string

  @Column({ type: "varchar", length: 128, nullable: true })
  content_hash: string | null // SHA256 para integridade

  @Column({ type: "timestamp" })
  accepted_at: Date

  @ManyToOne(() => Publisher, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "publisher_id" })
  publisher: Publisher | null

  @ManyToOne(() => Congregation, { nullable: true,  })
  @ManyToOne(() => Congregation, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "congregation_id" })
  congregation: Congregation | null

  @Column({ type: "uuid", nullable: true })
  accepted_by_user_id: string | null

  @ManyToOne(() => User, { nullable: true , onDelete: "SET NULL" })
  @JoinColumn({ name: "accepted_by_user_id" })
  accepted_by_user: User | null

  @ManyToOne(() => TermsOfUse, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "terms_id" })
  terms: TermsOfUse | null

  @Column({ type: "varchar", length: 100, nullable: true })
  deviceId: string | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
