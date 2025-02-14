import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm'
import { TerritoryHistory } from './TerritoryHistory'
import { Congregation } from './Congregation'

@Entity('territory')
export class Territory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "text" })
    name: string

    @Column({ type: "int", nullable: true })
    number: number

    @Column({ type: "text" })
    image_url: string

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ type: "text" })
    key: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => Congregation, congregation => congregation.territories, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: 'congregation_id' })
    congregation: Congregation

    @OneToMany(() => TerritoryHistory, history => history.territory, { cascade: true })
    histories: TerritoryHistory[]
}
