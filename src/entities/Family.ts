import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Congregation } from "./Congregation";
import { Publisher } from "./Publisher";

@Entity("families")
export class Family {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    name: string; // Ex.: "Família Silva"

    @ManyToOne(() => Congregation, congregation => congregation.id, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "congregation_id" })
    congregation: Congregation;

    @Column({ type: "uuid", nullable: true })
    congregation_id: string | null;

    // Se quiser definir um "responsável" (opcional)
    @ManyToOne(() => Publisher, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "responsible_publisher_id" })
    responsible: Publisher | null;

    @Column({ type: "uuid", nullable: true })
    responsible_publisher_id: string | null;

    @OneToMany(() => Publisher, publisher => publisher.family)
    members: Publisher[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
} 
