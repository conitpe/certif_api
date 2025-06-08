import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CriteriosService } from './criterios.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Criterio } from './criterio.entity';

@ApiTags('criterios')
@Controller('criterios')
export class CriteriosController {
  constructor(private readonly criteriosService: CriteriosService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener todos los criterios' })
  @ApiResponse({ status: 200, description: 'Lista de criterios obtenida con éxito.' })
  async findAll(): Promise<Criterio[]> {
    return this.criteriosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un criterio por ID' })
  @ApiResponse({ status: 200, description: 'Criterio obtenido con éxito.' })
  @ApiResponse({ status: 404, description: 'Criterio no encontrado.' })
  async findOne(@Param('id') id: string): Promise<Criterio> {
    return this.criteriosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo criterio' })
  @ApiResponse({ status: 201, description: 'Criterio creado con éxito.' })
  async create(@Body() createCriterioDto: { badge_id: string; description: string }): Promise<Criterio> {
    return this.criteriosService.create(createCriterioDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un criterio' })
  @ApiResponse({ status: 200, description: 'Criterio actualizado con éxito.' })
  @ApiResponse({ status: 404, description: 'Criterio no encontrado.' })
  async update(@Param('id') id: string, @Body() updateCriterioDto: { description?: string }): Promise<Criterio> {
    return this.criteriosService.update(id, updateCriterioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un criterio' })
  @ApiResponse({ status: 200, description: 'Criterio eliminado con éxito.' })
  @ApiResponse({ status: 404, description: 'Criterio no encontrado.' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.criteriosService.delete(id);
  }
}
