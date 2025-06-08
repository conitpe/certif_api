import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Badge } from '../badges/badge.entity';
import { Criterio } from './criterio.entity';

@Entity('criterios_badges')
export class CriterioBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  badge_id: string;

  @Column()
  criterio_id: string;

  @Column()
  descripcion: string;

  @ManyToOne(() => Badge, (badge) => badge.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @ManyToOne(() => Criterio, (criterio) => criterio.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'criterio_id' })
  criterio: Criterio;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creado_en: Date;
}
