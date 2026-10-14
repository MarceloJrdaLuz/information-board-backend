import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Publisher } from "./Publisher"
import { Privilege } from "./Privilege"

@Entity("publisher_privileges")
export class PublisherPrivilege {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ nullable: true })
  publisherId: string

  @ManyToOne(() => Publisher, publisher => publisher.privilegesRelation, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "publisherId" })
  publisher: Publisher

  @Column({ nullable: true })
  privilegeId: string

  @ManyToOne(() => Privilege, { onDelete: "CASCADE" })
  @JoinColumn({ name: "privilegeId" })
  privilege: Privilege

  @Column({ type: "date", nullable: true })
  startDate: Date | null

  @Column({ type: "date", nullable: true })
  endDate: Date | null

  @CreateDateColumn()
  created_at: Date
}
