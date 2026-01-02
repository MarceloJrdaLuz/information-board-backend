import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { PublicWitnessArrangement } from "./PublicWitnessArrangement"
import { PublicWitnessTimeSlotDefaultPublisher } from "./PublicWitnessTimeSlotDefaultPublisher"

@Entity("public_witness_time_slots")
export class PublicWitnessTimeSlot {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    arrangement_id: string

    @ManyToOne(() => PublicWitnessArrangement, { onDelete: "CASCADE" })
    @JoinColumn({ name: "arrangement_id" })
    arrangement: PublicWitnessArrangement

    @Column({ type: "time" })
    start_time: string

    @Column({ type: "time" })
    end_time: string

    @Column({ type: "int", default: 0 })
    order: number

    @Column({ type: "boolean", default: false })
    is_rotative: boolean;

    @OneToMany(() => PublicWitnessTimeSlotDefaultPublisher, dp => dp.timeSlot)
    defaultPublishers: PublicWitnessTimeSlotDefaultPublisher[]
}
