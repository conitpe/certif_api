import { ApiProperty } from '@nestjs/swagger';

export class CreateCriterioDto {
  @ApiProperty({ example: 'id', description: 'ID del criterio seleccionado' })
  id: string;

  @ApiProperty({ example: 'Descripción para el criterio', description: 'Descripción específica para el criterio' })
  descripcion: string;
}
