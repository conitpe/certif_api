import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Badge } from './badge.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService,
    private readonly usuariosService: UsuariosService
  ) { }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener badges según el rol del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de badges obtenida con éxito.' })
  
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener badges según el rol del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de badges obtenida con éxito.' })
  async findAll(
    @Request() req,
  ): Promise<{ items: Badge[]; total: number }> {
    const usuario = await this.usuariosService.findOne(req.user.userId);
    if (!usuario) {
      throw new Error('Usuario no autenticado.');
    }
  
    if (usuario.rol === 'superadministrador') {
      return this.badgesService.findAll();         // retorna { items, total }
    } else if (usuario.rol === 'administrador' && usuario.organizacion) {
      return this.badgesService.findByOrganizacion( // ahora también retorna { items, total }
        usuario.organizacion.id,
      );
    } else {
      return { items: [], total: 0 };
    }
  }

  @Get('organizacion/:organizacionId')
  @ApiOperation({ summary: 'Obtener badges por organización' })
  @ApiResponse({ status: 200, description: 'Lista de badges obtenida con éxito.' })
  async getBadgesByOrganizacion(
    @Param('organizacionId') organizacionId: string,
  ): Promise<{ items: Partial<Badge & { issuer: { id: string; razon_social: string } }>[], total: number }> {
    return this.badgesService.findByOrganizacion(organizacionId);
  }
  

  @Get('publico')
  @ApiOperation({ summary: 'Obtener todos los badges públicos con certificaciones' })
  @ApiResponse({ status: 200, description: 'Lista pública de badges con certificaciones.' })
  async getPublicBadges(): Promise<Badge[]> {
    return this.badgesService.findAllWithCertifications();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un badge por ID' })
  @ApiResponse({ status: 200, description: 'Badge obtenido con éxito.' })
  @ApiResponse({ status: 404, description: 'Badge no encontrado.' })
  async findOne(@Param('id') id: string): Promise<Badge> {
    return this.badgesService.findOne(id);
  }

   @Post()
  @ApiOperation({ summary: 'Crear un nuevo badge' })
  @ApiResponse({ status: 201, description: 'Badge creado con éxito.' })
  async create(@Body() createBadgeDto: CreateBadgeDto): Promise<Badge> {
    return this.badgesService.create(createBadgeDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un badge' })
  @ApiResponse({ status: 200, description: 'Badge actualizado con éxito.' })
  @ApiResponse({ status: 404, description: 'Badge no encontrado.' })
  async update(@Param('id') id: string, @Body() updateBadgeDto: UpdateBadgeDto): Promise<Badge> {
    return this.badgesService.update(id, updateBadgeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un badge' })
  @ApiResponse({ status: 200, description: 'Badge eliminado con éxito.' })
  @ApiResponse({ status: 404, description: 'Badge no encontrado.' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.badgesService.delete(id);
  }

  @Get('openbadge/:id')
@ApiOperation({ summary: 'Obtener badge JSON OpenBadge por ID' })
@ApiResponse({ status: 200, description: 'Badge OpenBadge generado con éxito.' })
@ApiResponse({ status: 404, description: 'Badge no encontrado.' })
async getBadgeOpenBadgeFormat(@Param('id') id: string) {
  return this.badgesService.getBadgeOpenBadgeFormat(id);
}

}
