import { ApiProperty } from '@nestjs/swagger';

export class CreateHabilidadBadgeDto {
  @ApiProperty({ example: 'uuid-de-habilidad' })
  habilidad_id: string;

  @ApiProperty({ example: 'uuid-del-badge' })
  badge_id: string;
}
