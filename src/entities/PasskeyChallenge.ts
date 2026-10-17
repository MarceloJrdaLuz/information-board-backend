import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum PasskeyChallengeType {
    REGISTRATION = "REGISTRATION",
    AUTHENTICATION = "AUTHENTICATION"
}

@Entity('passkey_challenges')
export class PasskeyChallenge {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    challenge: string;

    @Column({ type: "uuid", nullable: true, name: "user_id" })
    userId: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string | null;

    @Column({
        type: "enum",
        enum: PasskeyChallengeType,
        default: PasskeyChallengeType.AUTHENTICATION
    })
    type: PasskeyChallengeType;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ type: "timestamp", name: "expires_at" })
    expiresAt: Date;
}

