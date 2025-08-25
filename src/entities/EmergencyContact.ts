import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Publisher } from "./Publisher"
import { Congregation } from "./Congregation"

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

    @ManyToOne(() => Congregation, (congregation) => congregation.emergencyContacts, {
        onDelete: 'CASCADE',
    })
    congregation: Congregation;
}