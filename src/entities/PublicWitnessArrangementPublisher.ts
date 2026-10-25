import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm"
import { PublicWitnessArrangement } from "./PublicWitnessArrangement"
import { Publisher } from "./Publisher"

@Entity("public_witness_arrangement_publishers")
@Unique(["arrangement_id", "publisher_id"])
export class PublicWitnessArrangementPublisher {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "uuid" })
    arrangement_id: string

    @ManyToOne(() => PublicWitnessArrangement, { onDelete: "CASCADE" })
    @JoinColumn({ name: "arrangement_id" })
    arrangement: PublicWitnessArrangement

    @Column({ type: "uuid" })
    publisher_id: string

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher
}

