import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Publisher } from "./Publisher"
import { Privilege } from "./Privilege"

@Entity("publisher_privileges")
export class PublisherPrivilege {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Publisher, publisher => publisher.privilegesRelation, {
    onDelete: "CASCADE"
  })
  publisher: Publisher

  @ManyToOne(() => Privilege, { onDelete: "CASCADE" })
  privilege: Privilege

  @Column({ type: "date", nullable: true })
  startDate: Date | null

  @Column({ type: "date", nullable: true })
  endDate: Date | null

  @CreateDateColumn()
  created_at: Date
}
