import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Publisher } from "./Publisher";

@Entity("publisher_unavailabilities")
export class PublisherUnavailability {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher;

    @Column({ type: "uuid" })
    publisher_id: string;

    @Column({ type: "date" })
    startDate: string;

    @Column({ type: "date" })
    endDate: string;

    @Column({ type: "text", nullable: true })
    reason: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
