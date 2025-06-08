import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HabilidadesService } from './habilidades.service';
import { Habilidad } from './habilidades.entity';

@ApiTags('habilidades')
@Controller('habilidades')
export class HabilidadesController {
  constructor(private readonly habilidadesService: HabilidadesService) {}

  // Obtener todas las habilidades
  @Get()
  async findAll(): Promise<Habilidad[]> {
    return this.habilidadesService.findAll();
  }

  // Crear una nueva habilidad
  @Post()
  async create(@Body('nombre') nombre: string): Promise<Habilidad> {
    if (!nombre || nombre.trim() === '') {
      throw new BadRequestException('El nombre de la habilidad es obligatorio.');
    }

    const habilidadExistente = await this.habilidadesService.findByName(nombre.trim());
    if (habilidadExistente) {
      return habilidadExistente; // Devuelve la habilidad existente para evitar duplicados
    }

    return this.habilidadesService.create(nombre.trim());
  }
}
