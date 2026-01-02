import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { PublicWitnessTimeSlot } from "./PublicWitnessTimeSlot"
import { Publisher } from "./Publisher"

@Entity("public_witness_time_slot_default_publishers")
export class PublicWitnessTimeSlotDefaultPublisher {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    time_slot_id: string

    @ManyToOne(() => PublicWitnessTimeSlot, { onDelete: "CASCADE" })
    @JoinColumn({ name: "time_slot_id" })
    timeSlot: PublicWitnessTimeSlot

    @ManyToOne(() => Publisher)
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher

    @Column()
    publisher_id: string

    @Column({ type: "int", default: 0 })
    order: number
}
