import { Entity, PrimaryGeneratedColumn, Column,ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { CriterioBadge } from '../criterios/criterio-badge.entity';
import { Habilidad } from '../habilidades/habilidades.entity';
import { HabilidadBadge } from '../habilidades/habilidad-badge.entity';
import { PlantillaCertificado } from '../plantillas_certificados/plantillas_certificado.entity';
import { Certificado } from '../certificados/certificado.entity';
import { Organizacion } from 'src/organizaciones/organizacion.entity';
import { Criterio } from 'src/criterios/criterio.entity';



@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '1f3d4bc6-4d2f-11ec-81d3-0242ac130003', description: 'ID único del badge' })
  id: string;

  @Column()
  @ApiProperty({ example: 'Certificado de Excelencia', description: 'Nombre del badge' })
  nombre: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Este badge se otorga por completar...', description: 'Descripción del badge', required: false })
  descripcion?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'ruta/a/la/imagen.png', description: 'Ruta de la imagen del badge', required: false })
  ruta_imagen?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ example: '2024-12-12T10:00:00Z', description: 'Fecha de creación del badge' })
  creado_en: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @ApiProperty({ example: '2024-12-12T11:00:00Z', description: 'Fecha de actualización del badge' })
  actualizado_en: Date;

  @Column({ default: 'activo' })
  @ApiProperty({ example: 'activo', description: 'Estado del badge' })
  estado: string;

  @Column({ default: 'Certificación' })
  @ApiProperty({ example: 'Certificación', description: 'Tipo del badge' })
  tipo: string;

  @Column({ default: 'Principiante' })
  @ApiProperty({ example: 'Principiante', description: 'Nivel del badge' })
  nivel: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 30, description: 'Duración en días del badge', required: false })
  tiempo_duracion?: number;

  @Column({ default: 'Gratis' })
  @ApiProperty({ example: 'Gratis', description: 'Costo del badge' })
  costo: string;

  @Column({ default: false })
  @ApiProperty({ example: true, description: 'Si el badge es público' })
  publico: boolean;

 
  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'Enlace relacionado al badge', example: 'https://example.com/badge-details' })
  enlace_web: string;


  @Column({ nullable: true })
  @ApiProperty({ example: '1f3d4bc6-4d2f-11ec-81d3-0242ac130003', description: 'ID del emisor (organización)', required: false })
  issuer_id?: string;

  /*Mostrar la organizacion */
  @ManyToOne(() => Organizacion, { eager: true }) 
  @JoinColumn({ name: 'issuer_id' }) 
  issuer: Organizacion;

 
  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ example: '{"name": "Badge Metadata"}', description: 'Metadatos en formato JSON', required: false })
  json_metadata?: any;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ example: '[{ "criteria": "Complete task X" }]', description: 'Criterios del badge en formato JSON', required: false })
  criteria?: any;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ example: '[{ "alignment": "https://alignment.com" }]', description: 'Alineaciones del badge en formato JSON', required: false })
  alignment?: any;

  @Column({ type: 'text', array: true, nullable: true })
  @ApiProperty({ example: '["habilidad", "competencia"]', description: 'Etiquetas asociadas al badge', required: false })
  tags?: string[];

  @Column({ nullable: true })
  @ApiProperty({ example: 'urn:uuid:12345678-1234-5678-1234-567812345678', description: 'ID único del Open Badge', required: false })
  open_badge_id?: string;

  @OneToOne(() => PlantillaCertificado, (plantillaCertificado) => plantillaCertificado.badge, { cascade: true })
  @ApiProperty({ type: () => PlantillaCertificado, description: 'Plantilla de certificado asociada al badge' })
  plantillaCertificado: PlantillaCertificado;

  @OneToMany(() => CriterioBadge, (criterioBadge) => criterioBadge.badge, { cascade: true })
  @ApiProperty({
    type: () => CriterioBadge,
    isArray: true,
    description: 'Criterios asociados al badge',
  })
  criterios: CriterioBadge[];

  @OneToMany(() => HabilidadBadge, (habilidadBadge) => habilidadBadge.badge, { cascade: true })
  @ApiProperty({
    type: () => HabilidadBadge,
    isArray: true,
    description: 'Habilidades asociadas al badge',
  })
  habilidades: HabilidadBadge[];

  @OneToMany(() => Certificado, (certificado) => certificado.badge)
  certificados: Certificado[];
  

  
}
