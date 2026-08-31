import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Publisher } from "./Publisher";

@Entity("publisher_midweek_qualifications")
export class PublisherMidweekQualification {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher;

    @Column({ type: "uuid", unique: true })
    publisher_id: string;

    @Column({ type: "boolean", default: false })
    canBeChairman: boolean;

    @Column({ type: "boolean", default: false })
    canPray: boolean;

    @Column({ type: "boolean", default: false })
    canTreasuresTalk: boolean;

    @Column({ type: "boolean", default: false })
    canSpiritualGems: boolean;

    @Column({ type: "boolean", default: false })
    canBibleReading: boolean;

    @Column({ type: "boolean", default: true })
    canStudentInitialCall: boolean;

    @Column({ type: "boolean", default: true })
    canStudentReturnVisit: boolean;

    @Column({ type: "boolean", default: true })
    canStudentBibleStudy: boolean;

    @Column({ type: "boolean", default: true })
    canStudentExplainBeliefs: boolean;

    @Column({ type: "boolean", default: false })
    canStudentTalk: boolean;

    @Column({ type: "boolean", default: true })
    canBeAssistant: boolean;

    @Column({ type: "boolean", default: false })
    canLivingParts: boolean;

    @Column({ type: "boolean", default: false })
    canLocalNeeds: boolean;

    @Column({ type: "boolean", default: false })
    canCbsConductor: boolean;

    @Column({ type: "boolean", default: false })
    canCbsReader: boolean;

    @Column({ type: "boolean", default: false })
    canAuxCounselor: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
