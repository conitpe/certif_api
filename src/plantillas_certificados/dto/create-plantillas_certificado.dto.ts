import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';


export class CreatePlantillaCertificadoDto {
  @ApiProperty({ description: 'Título del certificado' })
  titulo: string;

  @ApiProperty({ description: 'Descripción del certificado', nullable: true })
  descripcion?: string;

  @ApiProperty({ description: 'URI externa asociada al certificado', nullable: true })
  uri_externa?: string;

  @ApiProperty({ description: 'Estado del certificado', example: 'pendiente' })
  estado?: 'pendiente' | 'publicado' | 'archivado';

  @ApiProperty({ description: 'Duración en días', nullable: true })
  duracion?: number;

  @ApiProperty({ description: 'Ruta de fondo del certificado', nullable: true })
  ruta_fondo?: string;

  @ApiProperty({ description: 'Coordenada X del QR', nullable: true })
  ubicacion_qr_x?: number;

  @ApiProperty({ description: 'Coordenada Y del QR', nullable: true })
  ubicacion_qr_y?: number;

  @ApiProperty({ description: 'Coordenada X del nombre', nullable: true })
  ubicacion_nombre_x?: number;

  @ApiProperty({ description: 'Coordenada Y del nombre', nullable: true })
  ubicacion_nombre_y?: number;

  @ApiProperty({ description: 'Coordenada X de la fecha de emisión', nullable: true })
  fecha_emision_x?: number;

  @ApiProperty({ description: 'Coordenada Y de la fecha de emisión', nullable: true })
  fecha_emision_y?: number;

  @ApiProperty({ description: 'Coordenada X de badge', nullable: true })
  badge_x?: number;

  @ApiProperty({ description: 'Coordenada Y de badge', nullable: true })
  badge_y?: number;

  @ApiProperty({ description: 'Coordenada X de idcertificado', nullable: true })
  id_certificado_x?: number;

  @ApiProperty({ description: 'Coordenada Y de idcertificado', nullable: true })
  id_certificado_y?: number;

  @ApiProperty({ description: 'Contenido del QR en formato HTML', nullable: true })
  contenido_qr?: string;

  @ApiProperty({ description: 'Contenido del nombre en formato HTML', nullable: true })
  contenido_nombre?: string;

  @ApiProperty({ description: 'Contenido de la fecha de emisión en formato HTML', nullable: true })
  contenido_fecha_emision?: string;

  @ApiProperty({ description: 'ID del badge asociado', required: true })
  @IsNotEmpty({ message: 'El ID del badge es obligatorio' })
  badge_id: string;

  // NUEVO CAMPO: es_predeterminada
  @ApiProperty({ description: 'Indica si esta plantilla es predeterminada para el badge', example: false })
  @IsBoolean({ message: 'El campo es_predeterminada debe ser un valor booleano' })
  @IsOptional()
  es_predeterminada?: boolean = false;

  
}
