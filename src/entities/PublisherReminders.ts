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

    /**
     * Regra de recorrência em dias
     * Ex: 30, 90, 180, 7, 45...
     */
    @Column({ type: "int", nullable: true })
    recurrenceIntervalDays?: number | null

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
