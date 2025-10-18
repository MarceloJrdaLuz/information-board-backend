import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Congregation } from "./Congregation"
import { HospitalityGroup } from "./HospitalityGroup."
import { Publisher } from "./Publisher"
import { Speaker } from "./Speaker"
import { Talk } from "./Talk"

@Entity("weekend_schedules")
export class WeekendSchedule {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "date" })
    date: string

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "chairman_id" })
    chairman: Publisher | null

    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "reader_id" })
    reader: Publisher | null

    @ManyToOne(() => Congregation, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "visiting_congregation_id" })
    visitingCongregation: Congregation | null

    @ManyToOne(() => Speaker, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "speaker_id" })
    speaker: Speaker | null

    @ManyToOne(() => Talk, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "talk_id" })
    talk: Talk | null

    @Column({ type: "text", nullable: true })
    watchTowerStudyTitle?: string | null

    @ManyToOne(() => HospitalityGroup, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "hospitality_group_id" })
    hospitalityGroup: HospitalityGroup | null

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation

    @Column({ type: "boolean", default: false })
    isSpecial?: boolean

    @Column({ type: "text", nullable: true })
    specialName?: string | null

    @Column({ type: "text", nullable: true })
    manualSpeaker?: string | null

    @Column({ type: "text", nullable: true })
    manualTalk?: string | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
