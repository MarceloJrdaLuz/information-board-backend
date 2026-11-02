import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Publisher } from "./Publisher";

@Entity("publisher_month_balances")
@Unique(["publisher_id", "month", "year"])
export class PublisherMonthBalance {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Publisher, { onDelete: "CASCADE" })
    @JoinColumn({ name: "publisher_id" })
    publisher: Publisher;

    @Column({ type: "uuid" })
    publisher_id: string;

    @Column({ type: "text" })
    month: string; // Ex: '1', '10', '11' ou nome do mês em maiúsculo (padronizado)

    @Column({ type: "text" })
    year: string; // Ex: '2026'

    @Column({ type: "int", default: 0 })
    transferred_minutes_in: number; // Minutos herdados do mês anterior

    @Column({ type: "int", default: 0 })
    transferred_minutes_out: number; // Minutos enviados para o próximo mês

    @Column({ type: "boolean", default: false })
    is_closed: boolean; // Se o relatório desse mês já foi fechado/enviado

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
