import { Controller, Get, Post, Put, Delete,Query,Param, Body,UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizacionesService } from './organizaciones.service';
import { Organizacion } from './organizacion.entity';
import { CreateOrganizacionDto } from './dto/create-organizacion.dto';
import { UpdateOrganizacionDto } from './dto/update-organizacion.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('organizaciones')
@Controller('organizaciones')
export class OrganizacionesController {
  constructor(private readonly organizacionesService: OrganizacionesService,
    private readonly usuariosService: UsuariosService
  ) {}

  

  @Post('registro')
@ApiOperation({ summary: 'Registrar una organización junto con su administrador' })
async registrarOrganizacion(@Body() data: { razon_social: string; ruc: string; emailAdmin: string; nombreAdmin: string; contrasena: string }) {
    if (!data.razon_social || !data.ruc || !data.emailAdmin || !data.nombreAdmin || !data.contrasena) {
        throw new BadRequestException('Todos los campos son obligatorios.');
    }

  
    const organizacion = await this.organizacionesService.create({
        ruc: data.ruc,
        razon_social: data.razon_social
    });

    const usuario = await this.usuariosService.create({
        nombre: data.nombreAdmin,
        apellido: "Sin apellido",
        email: data.emailAdmin,
        telefono: "",
        contrasena: data.contrasena,
        rol: 'administrador',
        resetPasswordToken: "",
        creado_en: new Date(),
        organizacion_id : organizacion.id
    });
    //await this.usuariosService.asignarOrganizacion(usuario.id, organizacion.id);

    return { message: 'Organización y usuario administrador registrados con éxito.', organizacion, usuario };
}

@Get("paginado")
@UseGuards(AuthGuard("jwt"))
@ApiOperation({ summary: "Obtener organizaciones con paginación y búsqueda" })
@ApiResponse({
  status: 200,
  description: "Lista paginada de organizaciones obtenida con éxito.",
})
async findAllPaginado(
  @Query("page")   page   = "1",
  @Query("limit")  limit  = "20",
  @Query("search") search = "",
): Promise<{ items: Organizacion[]; total: number }> {
  return this.organizacionesService.listarOrganizaciones(page, limit, search);
}

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar organizaciones por texto' })
  @ApiResponse({ status: 200, description: 'Lista de organizaciones filtrada con éxito.' })
  async buscarOrganizaciones(@Query('q') q: string): Promise<Organizacion[]> {   
    if (!q || !q.trim()) {
      return this.organizacionesService.findAll();
    }
    return this.organizacionesService.buscar(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una organización por ID' })
  @ApiResponse({ status: 200, description: 'Organización obtenida con éxito.' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada.' })
  async findOne(@Param('id') id: string): Promise<Organizacion> {
    return this.organizacionesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva organización' })
  @ApiResponse({ status: 201, description: 'Organización creada con éxito.' })
  async create(@Body() createOrganizacionDto: CreateOrganizacionDto): Promise<Organizacion> {
    return this.organizacionesService.create(createOrganizacionDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una organización' })
  @ApiResponse({ status: 200, description: 'Organización actualizada con éxito.' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada.' })
  async update(@Param('id') id: string, @Body() updateOrganizacionDto: UpdateOrganizacionDto): Promise<Organizacion> {
    return this.organizacionesService.update(id, updateOrganizacionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una organización' })
  @ApiResponse({ status: 200, description: 'Organización eliminada con éxito.' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada.' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.organizacionesService.delete(id);
  }
}
