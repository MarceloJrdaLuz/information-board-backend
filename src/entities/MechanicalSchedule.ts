import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { MechanicalMeetingType } from "../types/mechanical";
import { Congregation } from "./Congregation";
import { MechanicalAssignment } from "./MechanicalAssignment";

@Entity("mechanical_schedules")
export class MechanicalSchedule {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid" })
    congregation_id: string;

    @Column({ type: "date" })
    weekStartDate: string; // Segunda-feira da semana (YYYY-MM-DD)

    @Column({ type: "date" })
    date: string; // Data real da reunião (YYYY-MM-DD)

    @Column({
        type: "enum",
        enum: MechanicalMeetingType
    })
    meetingType: MechanicalMeetingType;

    @Column({ type: "text", nullable: true })
    notes: string | null;

    @Column({ type: "boolean", default: false })
    hasNoMeeting: boolean;

    @Column({ type: "text", nullable: true })
    eventTitle: string | null;

    @OneToMany(() => MechanicalAssignment, assignment => assignment.schedule, {
        cascade: true
    })
    assignments: MechanicalAssignment[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
