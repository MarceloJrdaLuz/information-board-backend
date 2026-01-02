import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm"
import { PublicWitnessAssignment } from "./PublicWitnessAssignment"
import { Publisher } from "./Publisher"

@Entity("public_witness_assignment_publishers")
@Unique(["assignment_id", "publisher_id"])
export class PublicWitnessAssignmentPublisher {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    assignment_id: string

    @ManyToOne(() => PublicWitnessAssignment, { onDelete: "CASCADE" })
    @JoinColumn({ name: "assignment_id" })
    assignment: PublicWitnessAssignment

    @Column()
    publisher_id: string

    @ManyToOne(() => Publisher)
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher

    @Column({ type: "int", default: 0 })
    order: number
}
