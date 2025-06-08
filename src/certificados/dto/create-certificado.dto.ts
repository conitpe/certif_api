import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsDateString, ValidateNested,IsJSON } from 'class-validator';
import { Type } from 'class-transformer';

export class PropietarioDto {
  @ApiProperty({ description: 'DNI del propietario' })
  @IsString()
  dni: string;

  @ApiProperty({ description: 'Correo del propietario' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Nombre del propietario' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Apellido del propietario' })
  @IsString()
  apellido: string;

  @ApiProperty({ description: 'Fecha de nacimiento del propietario', required: false })
  @IsDateString()
  @IsOptional()
  fecha_de_nacimiento?: string;

  @ApiProperty({ description: 'Teléfono del propietario', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;
  
  @ApiProperty({ example: '5e8c1a2d-6f3b-4c2a-b2b6-3a9d2e6a6b5c', description: 'ID de la organización', required: false })
  @IsString()
  @IsOptional() // 🔹 Hacer que `organizacion_id` no sea obligatorio
  organizacion_id?: string;
}

export class CreateCertificadoDto {
  @ApiProperty({ description: 'ID del badge asociado' })
  @IsUUID()
  badge_id: string;

  @ApiProperty({ description: 'ID de la plantilla asociada', required: false })
  @IsUUID()
  @IsOptional()
  plantilla_certificado_id?: string;

  @ApiProperty({ description: 'Datos del propietario del certificado (beneficiario)' })
  @ValidateNested()
  @Type(() => PropietarioDto) // Necesario para la validación de objetos anidados
  propietario: PropietarioDto;

  @ApiProperty({ description: 'Fecha de expiración del certificado', required: false })
  @IsDateString()
  @IsOptional()
  fecha_expiracion?: string;

  @ApiProperty({ description: 'Metadata adicional para el certificado', required: false })
  @IsJSON()
  @IsOptional()
  metadata?:Record<string, any>; 
}