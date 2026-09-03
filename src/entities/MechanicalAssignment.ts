import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { MechanicalRole } from "../types/mechanical";
import { MechanicalSchedule } from "./MechanicalSchedule";
import { Publisher } from "./Publisher";

@Entity("mechanical_assignments")
export class MechanicalAssignment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => MechanicalSchedule, schedule => schedule.assignments, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "schedule_id" })
    schedule: MechanicalSchedule;

    @Column({ type: "uuid" })
    schedule_id: string;

    @Column({
        type: "enum",
        enum: MechanicalRole
    })
    role: MechanicalRole;

    @Column({ type: "int", default: 1 })
    order: number;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    publisher_id: string | null;

    @Column({ type: "boolean", default: false })
    isManual: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

