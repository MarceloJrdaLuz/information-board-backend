import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"


@Entity('consent-record')
export class ConsentRecord {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: 'text' })
    fullName: string

    @Column({ type: 'text' })
    nickname: string

    @Column({ type: 'uuid', nullable: true })
    publisher_id: string

    @Column({ type: 'text' })
    congregation_id: string

    @Column({ type: 'text' })
    deviceId: string

    @Column({ type: 'date' })
    consentDate: Date

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

}