import { PartialType } from '@nestjs/swagger';
import { CreatePlantillaCertificadoDto } from './create-plantillas_certificado.dto';

export class UpdatePlantillaCertificadoDto extends PartialType(CreatePlantillaCertificadoDto) {}