import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
  } from 'typeorm';
  import { Badge } from '../badges/badge.entity';
  import { Habilidad } from './habilidades.entity'; 
  
  @Entity('habilidades_badges') 
  export class HabilidadBadge {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => Badge, (badge) => badge.habilidades, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'badge_id' })
    badge: Badge;
  
    @ManyToOne(() => Habilidad, { eager: true })
    @JoinColumn({ name: 'habilidad_id' })
    habilidad: Habilidad;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  }
  