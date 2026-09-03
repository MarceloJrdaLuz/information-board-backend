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

@Entity("mechanical_schedule_config")
export class MechanicalScheduleConfig {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid" })
    congregation_id: string;

    @Column({ type: "boolean", default: false })
    combineSoundAndMedia: boolean;

    @Column({ type: "boolean", default: false })
    sameTeamWholeWeek: boolean;

    // --- Quantidades Meio de Semana ---
    @Column({ type: "int", default: 2 })
    midweekAttendantsCount: number;

    @Column({ type: "int", default: 1 })
    midweekSoundCount: number;

    @Column({ type: "int", default: 1 })
    midweekMediaCount: number;

    @Column({ type: "int", default: 2 })
    midweekRovingMicsCount: number;

    @Column({ type: "int", default: 1 })
    midweekStageMicsCount: number;

    // --- Quantidades Fim de Semana ---
    @Column({ type: "int", default: 2 })
    weekendAttendantsCount: number;

    @Column({ type: "int", default: 1 })
    weekendSoundCount: number;

    @Column({ type: "int", default: 1 })
    weekendMediaCount: number;

    @Column({ type: "int", default: 2 })
    weekendRovingMicsCount: number;

    @Column({ type: "int", default: 1 })
    weekendStageMicsCount: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

