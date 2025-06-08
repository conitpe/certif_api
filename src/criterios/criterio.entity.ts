import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Badge } from '../badges/badge.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('criterios')
export class Criterio {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Identificador único del criterio', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ManyToOne(() => Badge, (badge) => badge.criterios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  @ApiProperty({ description: 'Badge asociado al criterio', type: () => Badge })
  badge: Badge;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Descripción del criterio', example: 'Completar el curso básico' })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ description: 'Fecha de creación del criterio', example: '2024-01-01T12:00:00Z' })
  created_at: Date;
}
