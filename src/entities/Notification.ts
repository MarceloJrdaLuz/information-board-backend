import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm"
import { User } from "./User"

export enum NotificationType {
    HOSPITALITY = "HOSPITALITY",
    SPEAKER = "SPEAKER",
    PUBLICWITNESS = "PUBLICWITNESS",
    FIELD_SERVICE = "FIELD_SERVICE",
    CLEANING = "CLEANING",
    READING = "READING",
    CHAIRMAN = "CHAIRMAN",
    REMINDER = "REMINDER",
}

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => User, user => user.notifications, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user: User

    @Column({ type: "uuid" })
    user_id: string

    @Column({
        type: "enum",
        enum: NotificationType,
    })
    type: NotificationType

    @Column({ type: "text" })
    title: string

    @Column({ type: "text" })
    body: string

    @Column({ type: "timestamp", nullable: true })
    scheduled_at: Date | null

    @Column({ type: "timestamp", nullable: true })
    sent_at: Date | null

    @Column({ type: "timestamp", nullable: true })
    read_at: Date | null

    @Column({ type: "json", nullable: true })
    data: Record<string, any> | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}