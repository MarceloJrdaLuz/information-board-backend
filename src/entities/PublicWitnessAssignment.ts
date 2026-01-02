import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { PublicWitnessTimeSlot } from "./PublicWitnessTimeSlot"
import { PublicWitnessAssignmentPublisher } from "./PublicWitnessAssignmentPublisher"

@Entity("public_witness_assignments")
export class PublicWitnessAssignment {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    time_slot_id: string

    @ManyToOne(() => PublicWitnessTimeSlot, { onDelete: "CASCADE" })
    @JoinColumn({ name: "time_slot_id" })
    timeSlot: PublicWitnessTimeSlot

    @OneToMany(() => PublicWitnessAssignmentPublisher, p => p.assignment)
    publishers: PublicWitnessAssignmentPublisher[]

    @Column({ type: "date" })
    date: string

    @CreateDateColumn()
    created_at: Date
}
