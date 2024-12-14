import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Territory } from './Territory'

@Entity('territory_history')
export class TerritoryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Territory, territory => territory.histories, { onDelete: 'CASCADE', eager: true })
  territory: Territory

  @Column()
  caretaker: string

  @Column()
  work_type: string

  @Column({ type: 'date' })
  assignment_date: string

  @Column({ type: 'date', nullable: true })
  completion_date: string
}
