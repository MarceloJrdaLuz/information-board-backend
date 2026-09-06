import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm"
import { PublicWitnessTimeSlot } from "./PublicWitnessTimeSlot"
import { Publisher } from "./Publisher"

@Entity("public_witness_time_slot_preferences")
@Unique(["time_slot_id", "publisher_id"])
export class PublicWitnessTimeSlotPreference {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "uuid" })
    time_slot_id: string

    @ManyToOne(() => PublicWitnessTimeSlot, { onDelete: "CASCADE" })
    @JoinColumn({ name: "time_slot_id" })
    timeSlot: PublicWitnessTimeSlot

    @Column({ type: "uuid" })
    publisher_id: string

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher
}

