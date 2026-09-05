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
import { User } from "./User"

export enum AccessRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELED = "CANCELED",
}

@Entity("access_requests")
export class AccessRequest {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "uuid" })
    user_id: string

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User

    @Column({ type: "uuid" })
    congregation_id: string

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation

    @Column({
        type: "enum",
        enum: AccessRequestStatus,
        default: AccessRequestStatus.PENDING,
    })
    status: AccessRequestStatus

    @Column({ type: "text", nullable: true })
    message: string | null

    @Column({ type: "text", nullable: true })
    response_observation: string | null

    @Column({ type: "uuid", nullable: true })
    reviewed_by_user_id: string | null

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "reviewed_by_user_id" })
    reviewed_by: User | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}

