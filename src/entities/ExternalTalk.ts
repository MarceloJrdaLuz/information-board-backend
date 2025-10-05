import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm"
import { Congregation } from "./Congregation"
import { Speaker } from "./Speaker"
import { Talk } from "./Talk"

export type ExternalTalkStatus = "pending" | "confirmed" | "canceled"

@Entity("external_talks")
export class ExternalTalk {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "date" })
    date: string

    @ManyToOne(() => Speaker, { onDelete: "CASCADE" })
    @JoinColumn({ name: "speaker_id" })
    speaker: Speaker

    @ManyToOne(() => Talk, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "talk_id" })
    talk: Talk | null

    @Column({ type: "text", nullable: true })
    manualTalk?: string | null

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "origin_congregation_id" }) // de onde o orador sai
    originCongregation: Congregation

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "destination_congregation_id" })
    destinationCongregation: Congregation

    @Column({
        type: "enum",
        enum: ["pending", "confirmed", "canceled"],
        default: "pending",
    })
    status: ExternalTalkStatus

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
