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

@Entity("push_subscriptions")
export class PushSubscription {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => User, user => user.pushSubscriptions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user: User

    @Column({ type: "uuid" })
    user_id: string

    @Column({ type: "text", unique: true })
    endpoint: string

    @Column({ type: "text" })
    p256dh: string

    @Column({ type: "text" })
    auth: string

    @Column({ type: "text", nullable: true })
    user_agent: string | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}