import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Publisher } from "./Publisher";
import { PublisherBibleStudent } from "./PublisherBibleStudent";

@Entity("publisher_field_activities")
export class PublisherFieldActivity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher;

    @Column({ type: "uuid" })
    publisher_id: string;

    @Column({ type: "date" })
    date: string; // YYYY-MM-DD

    @Column({ type: "int", default: 0 })
    minutes: number; // minutos gastos no ministério

    @Column({ type: "int", default: 0 })
    credit_minutes: number; // minutos de crédito de atividade aprovada

    @Column({ type: "text", nullable: true })
    credit_description: string | null; // descrição da atividade aprovada

    @Column({ type: "text", nullable: true })
    notes: string | null; // anotações pessoais do dia

    @ManyToOne(() => PublisherBibleStudent, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "bible_student_id" })
    bibleStudent: PublisherBibleStudent | null;

    @Column({ type: "uuid", nullable: true })
    bible_student_id: string | null;

    @Column({ type: "simple-array", nullable: true })
    bible_student_ids: string[] | null;

    bibleStudents?: PublisherBibleStudent[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
