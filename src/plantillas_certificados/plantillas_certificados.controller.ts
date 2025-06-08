import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  Req,
  Query,

} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlantillasCertificadosService } from './plantillas_certificados.service';
import { PlantillaCertificado } from './plantillas_certificado.entity';
import { CreatePlantillaCertificadoDto } from './dto/create-plantillas_certificado.dto';
import { UpdatePlantillaCertificadoDto } from './dto/update-plantillas_certificado.dto';

@ApiTags('Plantillas Certificados')
@Controller('plantillas-certificados')
export class PlantillasCertificadosController {
  constructor(private readonly plantillasService: PlantillasCertificadosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener plantillas (paginado + búsqueda)' })
  @ApiResponse({ status: 200, description: 'Lista paginada', type: [PlantillaCertificado] })
  async findAll(
    @Req() req: Request,
  ): Promise<{ items: PlantillaCertificado[]; total: number }> {
    return this.plantillasService.findAll();
  }


  @Get('listar/organizacion')
  @ApiOperation({ summary: 'Listar plantillas por organización (paginado + búsqueda)' })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/PlantillaCertificado' } },
        total: { type: 'integer' },
      },
    },
  })
  listarPorOrganizacion(
    @Query('organizacion_id') organizacionId: string,
    @Query('page')           page           = '1',
    @Query('limit')          limit          = '20',
    @Query('search')         search         = '',
  ): Promise<{ items: PlantillaCertificado[]; total: number }> {
    return this.plantillasService.listarPlantillasPorOrganizacion(
      organizacionId,
      page,
      limit,
      search,
    );
  }

  @Get('listar/simple')
@ApiOperation({ summary: 'Listar plantillas optimizadas para tabla' })
@ApiResponse({ status: 200, description: 'Plantillas listadas correctamente.' })
async listarSimple() {
  return this.plantillasService.listarPlantillasSimples();
}


  @Get(':id')
  @ApiOperation({ summary: 'Obtener una plantilla por ID' })
  @ApiResponse({ status: 200, type: PlantillaCertificado })
  async findOne(@Param('id') id: string): Promise<PlantillaCertificado> {
    const plantilla = await this.plantillasService.findOne(id);
    if (!plantilla) {
      throw new NotFoundException(`Plantilla con ID "${id}" no encontrada.`);
    }
    return plantilla;
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva plantilla de certificado' })
  @ApiResponse({ status: 201, type: PlantillaCertificado })
  async create(
    @Body() createPlantillaDto: CreatePlantillaCertificadoDto,
  ): Promise<PlantillaCertificado> {
    return this.plantillasService.create(createPlantillaDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una plantilla por ID' })
  @ApiResponse({ status: 200, type: PlantillaCertificado })
  async update(
    @Param('id') id: string,
    @Body() updatePlantillaDto: UpdatePlantillaCertificadoDto,
  ): Promise<PlantillaCertificado> {
    return this.plantillasService.update(id, updatePlantillaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una plantilla por ID' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    return this.plantillasService.delete(id);
  }
}