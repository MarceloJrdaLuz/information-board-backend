import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Publisher } from "./Publisher";

@Entity("publisher_bible_students")
export class PublisherBibleStudent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher;

    @Column({ type: "uuid" })
    publisher_id: string;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "boolean", default: true })
    active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
