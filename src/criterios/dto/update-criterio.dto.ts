import { PartialType } from '@nestjs/swagger';
import { CreateCriterioDto } from './create-criterio.dto'; // Asegúrate de que esta ruta es correcta

export class UpdateCriterioDto extends PartialType(CreateCriterioDto) {}
