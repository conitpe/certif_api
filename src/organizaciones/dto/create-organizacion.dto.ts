import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizacionDto {
  @ApiProperty({ example: '12345678901', description: 'RUC de la organización' })
  @IsNotEmpty()
  @IsString()
  ruc: string;

  @ApiProperty({ example: 'Global Tecnologías Academy', description: 'Nombre de la organización' })
  @IsNotEmpty()
  @IsString()
  razon_social: string;

  @ApiProperty({ example: 'www.web.pe', description: 'URL del sitio web' })
  @IsOptional()
  @IsString()
  url_web?: string;

  @ApiProperty({ example: 'Corporación', description: 'Tipo de organización' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiProperty({ example: 'Centro educativo...', description: 'Descripción de la organización' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 'Perú', description: 'País donde opera la organización' })
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiProperty({ example: '/imagenes/organizaciones/logo.png', description: 'Ruta de la imagen asociada' })
  @IsOptional()
  @IsString()
  url_imagen?: string;

  @ApiProperty({ example: 'contacto@web.pe', description: 'Correo electrónico de contacto' })
  @IsOptional()
  @IsString()
  email_contacto?: string;

  @ApiProperty({ example: 'soporte@web.pe', description: 'Correo electrónico de soporte' })
  @IsOptional()
  @IsString()
  email_soporte?: string;
}
