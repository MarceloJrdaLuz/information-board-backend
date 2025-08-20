import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm"
import { Publisher } from "./Publisher"

@Entity('emergency_contacts')
export class EmergencyContact {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text' })
    name: string

    @Column({ type: 'text' })
    phone: string

    @Column({ type: 'text', nullable: true })
    relationship: string

    @Column({ type: 'boolean', default: true })
    isTj: boolean

    @ManyToMany(() => Publisher, publisher => publisher.emergencyContacts)
    publishers: Publisher[]
}