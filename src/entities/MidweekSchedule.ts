import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Congregation } from "./Congregation";
import { MidweekMeetingPart } from "./MidweekMeetingPart";
import { MidweekWorkbookWeek } from "./MidweekWorkbookWeek";
import { Publisher } from "./Publisher";
import { MidweekSpecialType } from "./midweekEnums";

export { MidweekSpecialType } from "./midweekEnums";

@Entity("midweek_schedules")
export class MidweekSchedule {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid" })
    congregation_id: string;

    @ManyToOne(() => MidweekWorkbookWeek, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "workbook_week_id" })
    workbookWeek: MidweekWorkbookWeek | null;

    @Column({ type: "uuid", nullable: true })
    workbook_week_id: string | null;

    @Column({ type: "date" })
    weekDate: string;

    @Column({ type: "date" })
    meetingDate: string;

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

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "chairman_id" })
    chairman: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    chairman_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "opening_prayer_id" })
    openingPrayer: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    opening_prayer_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "closing_prayer_id" })
    closingPrayer: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    closing_prayer_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "aux_counselor_1_id" })
    auxCounselor1: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    aux_counselor_1_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "aux_counselor_2_id" })
    auxCounselor2: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    aux_counselor_2_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "cbs_conductor_id" })
    cbsConductor: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    cbs_conductor_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "cbs_reader_id" })
    cbsReader: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    cbs_reader_id: string | null;

    @Column({ type: "boolean", default: false })
    isSpecial: boolean;

    @Column({
        type: "enum",
        enum: MidweekSpecialType,
        default: MidweekSpecialType.NONE
    })
    specialType: MidweekSpecialType;

    @Column({ type: "text", nullable: true })
    specialName: string | null;

    @Column({ type: "text", nullable: true })
    notes: string | null;

    @OneToMany(() => MidweekMeetingPart, part => part.schedule, {
        cascade: true
    })
    parts: MidweekMeetingPart[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
