import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MidweekWorkbookWeek } from "./MidweekWorkbookWeek";
import { MidweekPartType, MidweekSection } from "./midweekEnums";

export { MidweekPartType, MidweekSection } from "./midweekEnums";

@Entity("midweek_workbook_parts")
export class MidweekWorkbookPart {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => MidweekWorkbookWeek, week => week.parts, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "workbook_week_id" })
    workbookWeek: MidweekWorkbookWeek;

    @Column({ type: "uuid" })
    workbook_week_id: string;

    @Column({
        type: "enum",
        enum: MidweekSection,
        default: MidweekSection.MINISTRY
    })
    section: MidweekSection;

    @Column({
        type: "enum",
        enum: MidweekPartType,
        default: MidweekPartType.INITIAL_CALL
    })
    partType: MidweekPartType;

    @Column({ type: "text" })
    title: string;

    @Column({ type: "text", nullable: true })
    sourceMaterial: string | null;

    @Column({ type: "int", default: 3 })
    timeMinutes: number;

    @Column({ type: "int", nullable: true })
    lessonNumber: number | null;

    @Column({ type: "int", nullable: true })
    studyPoint: number | null;

    @Column({ type: "text", nullable: true })
    studyPointDescription: string | null;

    @Column({ type: "text", nullable: true })
    brochure: string | null;

    @Column({ type: "boolean", default: false })
    requiresAssistant: boolean;

    @Column({ type: "text", nullable: true })
    method: string | null;

    @Column({ type: "simple-json", nullable: true })
    prompts: string[] | null;

    @Column({ type: "int", default: 0 })
    orderIndex: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
