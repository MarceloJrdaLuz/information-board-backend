import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MidweekSchedule } from "./MidweekSchedule";
import { MidweekWorkbookPart } from "./MidweekWorkbookPart";

@Entity("midweek_workbook_weeks")
export class MidweekWorkbookWeek {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "date", unique: true })
    weekDate: string; // Ex: "2025-06-02" (segunda-feira da semana)

    @Column({ type: "text", nullable: true })
    weeklyBibleReading: string | null;

    @Column({ type: "text", nullable: true })
    watchtowerStudyTheme: string | null;

    @Column({ type: "int", nullable: true })
    songOpen: number | null;

    @Column({ type: "int", nullable: true })
    songMiddle: number | null;

    @Column({ type: "int", nullable: true })
    songEnd: number | null;

    @Column({ type: "text", nullable: true })
    cbsSource: string | null;

    @Column({ type: "text", nullable: true })
    presentations: string | null;

    @OneToMany(() => MidweekWorkbookPart, part => part.workbookWeek, {
        cascade: true
    })
    parts: MidweekWorkbookPart[];

    @OneToMany(() => MidweekSchedule, schedule => schedule.workbookWeek)
    schedules: MidweekSchedule[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

