import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
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

    @OneToMany(() => Publisher, publisher => publisher.emergencyContact)
    publishers: Publisher[];
}