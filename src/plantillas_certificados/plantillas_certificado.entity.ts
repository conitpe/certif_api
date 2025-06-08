import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  JoinColumn, 
  OneToOne ,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Badge } from '../badges/badge.entity';
import { Certificado } from '../certificados/certificado.entity';
import { IsNotEmpty, IsBoolean } from 'class-validator';

@Entity('plantillas_certificados')
export class PlantillaCertificado {
  @ApiProperty({ description: 'ID único de la plantilla de certificado' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID de la organización asociada', nullable: true })
  @Column({ type: 'text', nullable: true })
  organizacion_id: string;

  @ApiProperty({ description: 'Ruta de la imagen de la insignia asociada', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  ruta_imagen_insignia: string;

  @ApiProperty({ description: 'Título del certificado' })
  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @ApiProperty({ description: 'Descripción del certificado', nullable: true })
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ApiProperty({ description: 'URI externa asociada al certificado', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  uri_externa: string;

  @ApiProperty({ description: 'Estado del certificado', example: 'publicado' })
  @Column({
    type: 'enum',
    enum: ['pendiente', 'publicado', 'archivado'], 
    default: 'pendiente', 
  })
  estado: 'pendiente' | 'publicado' | 'archivado'; 
  
  @ApiProperty({ description: 'Ruta de fondo del certificado', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  ruta_fondo: string;

  @ApiProperty({ description: 'Coordenada X del QR', nullable: true })
  @Column({ type: 'int', nullable: true })
  ubicacion_qr_x: number;

  @ApiProperty({ description: 'Coordenada Y del QR', nullable: true })
  @Column({ type: 'int', nullable: true })
  ubicacion_qr_y: number;

  @ApiProperty({ description: 'Coordenada X del nombre', nullable: true })
  @Column({ type: 'int', nullable: true })
  ubicacion_nombre_x: number;

  @ApiProperty({ description: 'Coordenada Y del nombre', nullable: true })
  @Column({ type: 'int', nullable: true })
  ubicacion_nombre_y: number;

  @ApiProperty({ description: 'Coordenada X de la fecha de emisión', nullable: true })
  @Column({ type: 'int', nullable: true })
  fecha_emision_x: number;

  @ApiProperty({ description: 'Coordenada Y de la fecha de emisión', nullable: true })
  @Column({ type: 'int', nullable: true })
  fecha_emision_y: number;

  @ApiProperty({ description: 'Coordenada X de Badge', nullable: true })
  @Column({ type: 'int', nullable: true })
  badge_x: number;

  @ApiProperty({ description: 'Coordenada Y de la Badge', nullable: true })
  @Column({ type: 'int', nullable: true })
  badge_y: number;

  @ApiProperty({ description: 'Coordenada X de Id Certificado', nullable: true })
  @Column({ type: 'int', nullable: true })
  id_certificado_x: number;

  @ApiProperty({ description: 'Coordenada Y de Id Certificado', nullable: true })
  @Column({ type: 'int', nullable: true })
  id_certificado_y: number;


  @ApiProperty({ description: 'Duración en días', nullable: true })
  @Column({ type: 'int', nullable: true })
  duracion: number;

  @ApiProperty({ description: 'Contenido enriquecido del nombre', nullable: true })
  @Column({ type: 'text', nullable: true })
  contenido_nombre: string;

  @ApiProperty({ description: 'Contenido enriquecido del QR', nullable: true })
  @Column({ type: 'text', nullable: true })
  contenido_qr: string;

  @ApiProperty({ description: 'Contenido enriquecido de la fecha de emisión', nullable: true })
  @Column({ type: 'text', nullable: true })
  contenido_fecha_emision: string;

  @ApiProperty({ description: 'Fecha de creación de la plantilla', default: () => 'CURRENT_TIMESTAMP' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creado_en: Date;

  @ApiProperty({ description: 'Fecha de eliminación de la plantilla', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  eliminado_en: Date | null;

  @ManyToOne(() => Badge, (badge) => badge.certificados)
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @OneToMany(() => Certificado, (certificado) => certificado.plantilla)
@ApiProperty({ type: () => [Certificado], description: 'Lista de certificados asociados a esta plantilla' })
certificados: Certificado[];

@ApiProperty({ description: 'Define si esta plantilla es la predeterminada para su Badge', default: false })
@Column({ type: 'boolean', default: false }) // ✅ Definir correctamente como columna
@IsBoolean()
es_predeterminada: boolean;

}