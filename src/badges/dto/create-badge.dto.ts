import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsArray, IsNumber, IsJSON } from 'class-validator';

export class CreateBadgeDto {
  @ApiProperty({ example: 'Certificado de Excelencia', description: 'Nombre del badge' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Este badge se otorga por completar...', description: 'Descripción del badge', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 'ruta/a/la/imagen.png', description: 'Ruta de la imagen del badge', required: false })
  @IsString()
  @IsOptional()
  ruta_imagen?: string;

  @ApiProperty({ example: 'activo', description: 'Estado del badge', required: false })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({ example: 'Certificación', description: 'Tipo del badge', required: false })
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiProperty({ example: 'Principiante', description: 'Nivel del badge', required: false })
  @IsString()
  @IsOptional()
  nivel?: string;

  @ApiProperty({ example: 30, description: 'Duración en días del badge', required: false })
  @IsNumber()
  @IsOptional()
  tiempo_duracion?: number;

  @ApiProperty({ example: 'Gratis', description: 'Costo del badge', required: false })
  @IsString()
  @IsOptional()
  costo?: string;

  @ApiProperty({ example: true, description: 'Si el badge es público', required: false })
  @IsBoolean()
  @IsOptional()
  publico?: boolean;

  @ApiProperty({ example: '1f3d4bc6-4d2f-11ec-81d3-0242ac130003', description: 'ID del emisor (organización)', required: false })
  @IsUUID()
  @IsOptional()
  issuer_id?: string;

  @ApiProperty({ example: '{"name": "Badge Metadata"}', description: 'Metadatos en formato JSON', required: false })
  @IsJSON()
  @IsOptional()
  json_metadata?: any;

  @ApiProperty({ example: '[{ "criteria": "Complete task X" }]', description: 'Criterios del badge en formato JSON', required: false })
  @IsJSON()
  @IsOptional()
  criteria?: any;

  @ApiProperty({ example: '[{ "alignment": "https://alignment.com" }]', description: 'Alineaciones del badge en formato JSON', required: false })
  @IsJSON()
  @IsOptional()
  alignment?: any;

  @ApiProperty({ example: '["habilidad", "competencia"]', description: 'Etiquetas asociadas al badge', required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 'urn:uuid:12345678-1234-5678-1234-567812345678', description: 'ID único del Open Badge', required: false })
  @IsString()
  @IsOptional()
  open_badge_id?: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        criterio_id: { type: 'string', example: 'id-del-criterio', description: 'ID del criterio seleccionado' },
        descripcion: { type: 'string', example: 'Descripción específica', description: 'Descripción adicional para el criterio' },
      },
    },
    required: false,
  })
  criterios?: {
    criterio_id: string;
    descripcion: string;
  }[];

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'string' }, 
    description: 'IDs de habilidades asociadas',
    required: false })
  habilidades?: string[]; 

  
}
