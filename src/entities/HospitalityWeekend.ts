import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { HospitalityAssignment } from "./HospitalityAssignment"
import { Congregation } from "./Congregation"

@Entity("hospitality_weekend")
export class HospitalityWeekend {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "date" })
  date: string

  @ManyToOne(() => Congregation, congregation => congregation.hospitalityWeekends, { onDelete: "CASCADE" })
  @JoinColumn({ name: "congregation_id" })
  congregation: Congregation

  @Column()
  congregation_id: string

  @OneToMany(() => HospitalityAssignment, assignment => assignment.weekend, { cascade: true })
  assignments: HospitalityAssignment[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
