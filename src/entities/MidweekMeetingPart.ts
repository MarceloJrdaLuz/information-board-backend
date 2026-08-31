import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MidweekPartType, MidweekRoom, MidweekSection } from "./midweekEnums";
import { MidweekSchedule } from "./MidweekSchedule";
import { MidweekWorkbookPart } from "./MidweekWorkbookPart";
import { Publisher } from "./Publisher";

export { MidweekRoom } from "./midweekEnums";

@Entity("midweek_meeting_parts")
export class MidweekMeetingPart {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => MidweekSchedule, schedule => schedule.parts, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "schedule_id" })
    schedule: MidweekSchedule;

    @Column({ type: "uuid" })
    schedule_id: string;

    @ManyToOne(() => MidweekWorkbookPart, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "workbook_part_id" })
    workbookPart: MidweekWorkbookPart | null;

    @Column({ type: "uuid", nullable: true })
    workbook_part_id: string | null;

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

    @Column({
        type: "enum",
        enum: MidweekRoom,
        default: MidweekRoom.MAIN
    })
    room: MidweekRoom;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "assigned_publisher_id" })
    assignedPublisher: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    assigned_publisher_id: string | null;

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "assistant_publisher_id" })
    assistantPublisher: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    assistant_publisher_id: string | null;

    @Column({ type: "varchar", nullable: true })
    custom_speaker_name: string | null;

    @Column({ type: "int", default: 0 })
    orderIndex: number;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @Column({ type: "boolean", default: false })
    isCompleted: boolean;

    @Column({ type: "simple-json", nullable: true })
    prompts: string[] | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
