import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Congregation } from "./Congregation";

@Entity("schedule_reminder_configs")
export class ScheduleReminderConfig {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid", unique: true })
    congregation_id: string;

    // Limpeza
    @Column({ type: "int", default: 15 })
    cleaning_days_before: number;

    @Column({ type: "boolean", default: true })
    cleaning_enabled: boolean;

    // Campo
    @Column({ type: "int", default: 15 })
    field_service_days_before: number;

    @Column({ type: "boolean", default: true })
    field_service_enabled: boolean;

    // Testemunho Público
    @Column({ type: "int", default: 15 })
    public_witnessing_days_before: number;

    @Column({ type: "boolean", default: true })
    public_witnessing_enabled: boolean;

    // Reunião Meio de Semana
    @Column({ type: "int", default: 30 })
    midweek_meeting_days_before: number;

    @Column({ type: "boolean", default: true })
    midweek_meeting_enabled: boolean;

    // Reunião Fim de Semana (Oradores)
    @Column({ type: "int", default: 20 })
    weekend_meeting_days_before: number;

    @Column({ type: "boolean", default: true })
    weekend_meeting_enabled: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
