import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { Publisher } from "./Publisher"

@Entity("hospitality_group")
@Unique(["congregation", "name"])
export class HospitalityGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: 'text' })
  name: string

  @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "congregation_id" })
  congregation: Congregation

  // Anfitrião
  @ManyToOne(() => Publisher, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "publisher_id" })
  host: Publisher | null

  @Column({ type: "date", nullable: true })
  next_reception: string | null

  @Column({ type: "int", nullable: true })
  position: number | null

  @OneToMany(() => Publisher, publisher => publisher.hospitalityGroup)
  members: Publisher[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
