import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { HospitalityAssignment } from "./HospitalityAssignment"

@Entity("hospitality_weekend")
export class HospitalityWeekend {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "date" })
  date: string 

  @OneToMany(() => HospitalityAssignment, assignment => assignment.weekend, { cascade: true })
  assignments: HospitalityAssignment[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
