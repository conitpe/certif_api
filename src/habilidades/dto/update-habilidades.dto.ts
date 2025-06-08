import { PartialType } from '@nestjs/swagger';
import { CreateHabilidadeDto } from './create-habilidades.dto';

export class UpdateHabilidadeDto extends PartialType(CreateHabilidadeDto) {}
