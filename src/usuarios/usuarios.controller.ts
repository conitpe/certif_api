import {
  Controller,
  Get,
  Request,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { UsuariosService } from "./usuarios.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Usuario } from "./usuario.entity";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("usuarios")
@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get("protegido")
  @UseGuards(AuthGuard("jwt")) // Solo accesible con un token válido
  getProtegido() {
    return "Este es un endpoint protegido";
  }

  // usuarios.controller.ts

@Get("organizacion/vinculados/:organizacionId")
@UseGuards(AuthGuard("jwt"))
@ApiOperation({ summary: "Obtener usuarios vinculados a una organización" })
@ApiResponse({
  status: 200,
  description: "Lista de usuarios obtenida con éxito.",
})
getUsuariosVinculados(
  @Param("organizacionId") organizacionId: string,
  @Query("page")   page   = "1",
  @Query("limit")  limit  = "20",
  @Query("search") search = "",
): Promise<{ items: Usuario[]; total: number }> {
  return this.usuariosService.findUsuariosVinculados(
    organizacionId,
    page,
    limit,
    search,
  );
}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Obtener usuarios según el rol" })
  @ApiResponse({
    status: 200,
    description: "Lista de usuarios obtenida con éxito.",
  })
  async findAll(@Request() req): Promise<Usuario[]> {
    const usuario = await this.usuariosService.findOne(req.user.userId);

    if (!usuario) {
      throw new NotFoundException("Usuario no autenticado.");
    }

    if (usuario.rol === "superadministrador") {
      return this.usuariosService.findAll();
    } else if (usuario.rol === "administrador" && usuario.organizacion) {
      return this.usuariosService.findByOrganizacion(usuario.organizacion.id); // 🔹 Solo usuarios de su organización
    } else {
      return [];
    }
  }


@Get("beneficiarios")
@UseGuards(AuthGuard("jwt"))
@ApiOperation({ summary: "Obtener beneficiarios según el rol del usuario" })
@ApiResponse({
  status: 200,
  description: "Lista de beneficiarios obtenida con éxito.",
})
async findBeneficiarios(
  @Request() req,
  @Query('page')   page   = '1',   
  @Query('limit')  limit  = '20',  
  @Query('search') search = '',    
): Promise<{ items: Usuario[]; total: number }> {
  const usuario = await this.usuariosService.findOne(req.user.userId);
  if (!usuario) throw new NotFoundException("Usuario no autenticado.");

  if (usuario.rol === "superadministrador") {
    return this.usuariosService.listarBeneficiarios(
      "beneficiario",
      page,
      limit,
      search,
    );
  }

  if (usuario.rol === "administrador" && usuario.organizacion) {
    return this.usuariosService.listarBeneficiariosConCertificados(
      usuario.organizacion.id,
      page,
      limit,
      search,
    );
  }

  return { items: [], total: 0 };
}


  @Get("organizacion/:id")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Obtener usuarios de una organización específica" })
  @ApiResponse({
    status: 200,
    description: "Lista de usuarios obtenida con éxito.",
  })
  @ApiResponse({
    status: 404,
    description: "Organización no encontrada o sin usuarios.",
  })
  async findByOrganizacion(
    @Param("id") organizacionId: string,
  ): Promise<Usuario[]> {
    const usuarios =
      await this.usuariosService.findByOrganizacion(organizacionId);

    if (!usuarios.length) {
      throw new NotFoundException(
        `No hay usuarios en la organización con ID "${organizacionId}"`,
      );
    }

    return usuarios;
  }

  @Put(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Actualizar un usuario" })
  @ApiResponse({ status: 200, description: "Usuario actualizado con éxito." })
  @ApiResponse({ status: 404, description: "Usuario no encontrado." })
  async update(
    @Param("id") id: string,
    @Body() usuario: Partial<Usuario>,
  ): Promise<Usuario> {
    return this.usuariosService.update(id, usuario);
  }

  @Delete(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Eliminar un usuario" })
  @ApiResponse({ status: 200, description: "Usuario eliminado con éxito." })
  @ApiResponse({ status: 404, description: "Usuario no encontrado." })
  async delete(@Param("id") id: string): Promise<void> {
    return this.usuariosService.delete(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear un usuario" })
  @ApiResponse({ status: 201, description: "Usuario creado con éxito." })
  async create(@Body() usuarioData: Partial<Usuario>): Promise<Usuario> {
    console.log("📩 Datos recibidos en el backend:", usuarioData);
    return this.usuariosService.create(usuarioData);
  }

  @Get("buscar")
  @ApiOperation({ summary: "Buscar usuario por correo" })
  @ApiResponse({ status: 200, description: "Usuario encontrado con éxito." })
  @ApiResponse({ status: 404, description: "Usuario no encontrado." })
  async buscarUsuarioPorCorreo(
    @Query("email") email: string,
  ): Promise<Usuario> {
    console.log(" Backend recibió email:", email);
    if (!email) {
      throw new NotFoundException('El parámetro "email" es obligatorio.');
    }

    const usuario = await this.usuariosService.buscarPorCorreo(email);

    if (!usuario) {
      console.log(" No se encontró el usuario con email:", email);
      throw new NotFoundException(
        `No se encontró un usuario con el email "${email}".`,
      );
    }

    console.log("Usuario encontrado:", usuario);
    return usuario;
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener un usuario por ID" })
  @ApiResponse({ status: 200, description: "Usuario obtenido con éxito." })
  @ApiResponse({ status: 404, description: "Usuario no encontrado." })
  async findOne(@Param("id") id: string): Promise<Partial<Usuario>> {
    const usuario = await this.usuariosService.findOne(id);
    const { contrasena, token_verificacion, ...resto } = usuario;
    return resto;
  }
}
