import { Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { Publisher } from "./Publisher"
import { Talk } from "./Talk"

@Entity("speakers")
@Index("uq_speaker_name_publisher_creator", ["fullName", "publisher", "creatorCongregation"], { unique: true })
export class Speaker {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "text" })
  fullName: string

  @Column({ type: "text", nullable: true })
  phone: string

  @Column({ type: "text", nullable: true })
  address: string

  @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_congregation_id" })
  creatorCongregation: Congregation; // quem criou o cadastro

  @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "origin_congregation_id" })
  originCongregation: Congregation; // de onde o orador é

  @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "publisher_id" })
  publisher: Publisher | null

  @ManyToMany(() => Talk, talk => talk.speakers)
  @JoinTable({
    name: "speakers_talks",
    joinColumn: { name: "speaker_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "talk_id", referencedColumnName: "id" }
  })
  talks: Talk[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
