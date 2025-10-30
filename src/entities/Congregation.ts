import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Document } from "./Document"
import { Notice } from "./Notice"
import { User } from "./User"
import { EndweekDays, MidweekDays } from "../types/enumWeekDays"
import { Group } from "./Group"
import { Territory } from "./Territory"
import { EmergencyContact } from "./EmergencyContact"
import { HospitalityWeekend } from "./HospitalityWeekend"

export enum CongregationType {
  SYSTEM = "system",   // congregações que usam o sistema normalmente
  AUXILIARY = "auxiliary" // congregações criadas para outro objetivo
}

@Entity('congregation')
export class Congregation {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'text', unique: true })
  number: string

  @Column({ type: 'text' })
  city: string

  @Column({ type: 'text' })
  circuit: string

  @Column({
    type: "enum",
    enum: CongregationType,
  })
  type: CongregationType

  @Column({ type: "enum", enum: MidweekDays, nullable: true })
  dayMeetingLifeAndMinistary: MidweekDays

  @Column({ type: "time", nullable: true })
  hourMeetingLifeAndMinistary: string

  @Column({ type: "enum", enum: EndweekDays, nullable: true })
  dayMeetingPublic: EndweekDays

  @Column({ type: "time", nullable: true })
  hourMeetingPublic: string

  @Column({ type: 'text', nullable: true })
  image_url: string

  @Column({ type: "text", nullable: true })
  imageKey: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  /**
* creatorCongregation:
* - null para congregações SYSTEM (criadas pelo superAdmin)
* - aponta para a congregação SYSTEM que criou, no caso das AUXILIARY
*/
  @ManyToOne(() => Congregation, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_congregation_id" })
  creatorCongregation: Congregation | null

  @OneToMany(() => User, user => user.congregation)
  users: User[]

  @OneToMany(() => Document, document => document.congregation)
  documents: Document[]

  @OneToMany(() => Territory, document => document.congregation)
  territories: Territory[]

  @OneToMany(() => Notice, notice => notice.congregation)
  notices: Notice[]

  @OneToMany(() => Group, group => group.groupOverseers, { nullable: true }) // Relacionamento One-to-Many com Group (opcional)
  groups: Group[]

  @OneToMany(() => EmergencyContact, (emergencyContact) => emergencyContact.congregation)
  emergencyContacts: EmergencyContact[]

  @OneToMany(() => HospitalityWeekend, weekend => weekend.congregation)
  hospitalityWeekends: HospitalityWeekend[]

  @Column({ type: "boolean", default: false })
  has_active_consent: boolean
}