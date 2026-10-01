import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Congregation } from "./Congregation";

export enum SpecialEventType {
    CIRCUIT_ASSEMBLY = "CIRCUIT_ASSEMBLY",
    REGIONAL_CONVENTION = "REGIONAL_CONVENTION",
    MEMORIAL = "MEMORIAL",
    CIRCUIT_OVERSEER_VISIT = "CIRCUIT_OVERSEER_VISIT",
    SPECIAL_TALK = "SPECIAL_TALK",
    CUSTOM = "CUSTOM"
}

export enum EventImpactScope {
    NONE = "NONE",
    EVENT_DAYS_ONLY = "EVENT_DAYS_ONLY",
    ALL_DAYS = "ALL_DAYS"
}

@Entity("special_events")
export class SpecialEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Congregation, { onDelete: "CASCADE" })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid" })
    congregation_id: string;

    @Column({
        type: "enum",
        enum: SpecialEventType,
        default: SpecialEventType.CUSTOM
    })
    type: SpecialEventType;

    @Column({ type: "text" })
    title: string;

    @Column({ type: "date" })
    startDate: string; // YYYY-MM-DD

    @Column({ type: "date" })
    endDate: string; // YYYY-MM-DD

    @Column({ type: "boolean", default: true })
    affectsWholeWeek: boolean;

    // --- Matriz de Impacto ---

    @Column({ type: "boolean", default: false })
    cancelMidweekMeeting: boolean;

    @Column({ type: "boolean", default: false })
    cancelWeekendMeeting: boolean;

    @Column({ type: "boolean", default: false })
    isCircuitOverseerVisit: boolean;

    @Column({ type: "boolean", default: false })
    cancelCleaning: boolean;

    @Column({
        type: "enum",
        enum: EventImpactScope,
        default: EventImpactScope.NONE
    })
    fieldServiceImpact: EventImpactScope;

    @Column({
        type: "enum",
        enum: EventImpactScope,
        default: EventImpactScope.NONE
    })
    publicWitnessingImpact: EventImpactScope;

    @Column({ type: "boolean", default: true })
    showOnPublicBoard: boolean;

    // --- Detalhes do Evento ---

    @Column({ type: "text", nullable: true })
    theme: string | null;

    @Column({ type: "text", nullable: true })
    location: string | null;

    @Column({ type: "text", nullable: true })
    notes: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
