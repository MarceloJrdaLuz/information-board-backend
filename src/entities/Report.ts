import { 
    Column, 
    CreateDateColumn, 
    Entity, 
    JoinColumn, 
    ManyToOne, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn, 
    Unique 
} from "typeorm";
import { Publisher } from "./Publisher";
import { Months } from "../types/enumWeekDays";

@Entity('reports')
@Unique(["publisher", "month", "year"]) // Define a constraint única
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "enum", enum: Months })
    month: Months;

    @Column({ type: 'simple-array', nullable: true })
    privileges: string[];

    @Column({ type: "text" })
    year: string;

    @Column({ type: "text", nullable: true })
    group: string;

    @ManyToOne(() => Publisher, publisher => publisher.id, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: 'publisher_id' })
    publisher: Publisher;

    @Column({ type: "int" })
    hours: number;

    @Column({ type: "int", nullable: true })
    studies: number;

    @Column({ type: "text", nullable: true })
    observations: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
