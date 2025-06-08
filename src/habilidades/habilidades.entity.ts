import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Badge } from '../badges/badge.entity';

@Entity('habilidades')
export class Habilidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true }) // Evitar nombres duplicados
  nombre: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creado_en: Date;

  @Column({ type: 'timestamp', nullable: true })
  eliminado_en: Date | null;

  @ManyToMany(() => Badge, (badge) => badge.habilidades)
  @JoinTable({
    name: 'habilidades_badges', 
    joinColumn: { name: 'habilidad_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'badge_id', referencedColumnName: 'id' },
  })
  badges: Badge[];
}
