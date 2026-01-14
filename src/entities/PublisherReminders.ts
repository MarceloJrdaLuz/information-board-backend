import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm"
import { Publisher } from "./Publisher"

// types/RecurrenceType.ts ou dentro do arquivo da entidade
export enum RecurrenceType {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
@Entity("publisher_reminders")
export class PublisherReminder {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher

    @Column({ type: "text" })
    title: string

    @Column({ type: "text", nullable: true })
    description?: string | null

    /**
     * Data a partir da qual o lembrete começa a aparecer
     */
    @Column({ type: "date" })
    startDate: string

    /**
     * Data limite para exibição
     * null = sem data final
     */
    @Column({ type: "date", nullable: true })
    endDate?: string | null

    /**
     * Indica se o lembrete é recorrente
     */
    @Column({ type: "boolean", default: false })
    isRecurring: boolean


    @Column({
        name: "recurrenceIntervalDays", // <-- Garante que no banco o nome continue o mesmo
        type: "int",
        nullable: true
    })
    recurrenceInterval?: number | null // <-- No seu código, você usa esse nome mais bonito

    @Column({
        type: "enum",
        enum: RecurrenceType,
        default: RecurrenceType.DAILY
    })
    recurrenceType: RecurrenceType

    /**
     * Quantas vezes deve repetir
     * null = infinito
     */
    @Column({ type: "int", nullable: true })
    recurrenceCount?: number | null

    /**
     * Quantas recorrências já foram executadas
     * Ajuda muito no controle
     */
    @Column({ type: "int", default: 0 })
    recurrenceExecutedCount: number

    /**
     * Ativação lógica
     */
    @Column({ type: "boolean", default: true })
    isActive: boolean

    @Column({ type: 'date', nullable: true })
    completed_until: string | null

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
