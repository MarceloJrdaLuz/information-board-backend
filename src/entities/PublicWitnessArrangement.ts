import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { PublicWitnessTimeSlot } from "./PublicWitnessTimeSlot"

@Entity("public_witness_arrangements")
export class PublicWitnessArrangement {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  congregation_id: string

  @ManyToOne(() => Congregation)
  @JoinColumn({ name: "congregation_id" })
  congregation: Congregation

  @Column({ type: "boolean", default: false })
  is_fixed: boolean

  @Column({ type: "int", nullable: true })
  weekday: number | null // 0–6 quando fixo

  @Column({ type: "date", nullable: true })
  date: string | null // quando específico

  @Column({ type: "varchar", nullable: true })
  title: string | null

  @OneToMany(() => PublicWitnessTimeSlot, slot => slot.arrangement, { cascade: true })
  timeSlots: PublicWitnessTimeSlot[]

  @CreateDateColumn()
  created_at: Date
}
