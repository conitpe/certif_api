import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Put,
  Delete,
  Header,
  Param,
  BadRequestException,
  Res,
  NotFoundException,
} from "@nestjs/common";
import { CertificadosService } from "./certificados.service";
import { CreateCertificadoDto } from "./dto/create-certificado.dto";
import { UpdateCertificadoDto } from "./dto/update-certificado.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Certificado } from "./certificado.entity";
import { Response } from "express";
/**
 * @controller CertificadosController
 * @description Controlador para gestionar certificados y exportarlos en formato OpenBadge.
 */

@ApiTags("Certificados")
@Controller("certificados")
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post("emitir")
  @ApiOperation({ summary: "Emitir un certificado" })
  @ApiResponse({
    status: 201,
    description: "Certificado emitido correctamente.",
    type: Certificado,
  })
  @ApiResponse({ status: 400, description: "Solicitud inválida." })
  async emitirCertificado(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.certificadosService.emitirCertificado(createCertificadoDto);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos los certificados o por badge" })
  @ApiResponse({
    status: 200,
    type: [Certificado],
    description: "Lista de certificados.",
  })
  async findAll(@Query("badge_id") badge_id?: string) {
    console.log("Valor de badge_id recibido:", badge_id);

    if (badge_id) {
      if (!/^[0-9a-fA-F-]{36}$/.test(badge_id.trim())) {
        throw new BadRequestException("El badge_id debe ser un UUID válido");
      }
      console.log("Consultando certificados con badge_id:", badge_id.trim());
      return this.certificadosService.findAllByBadge(badge_id.trim());
    }
    console.log("Consultando todos los certificados...");
    return this.certificadosService.findAll();
  }

  @Get("descargar/:id/pdf")
  async generarCertificado(@Param("id") id: string, @Res() res: Response) {
    const certificado = await this.certificadosService.findOne(id);
    if (!certificado) {
      throw new NotFoundException(`Certificado con ID "${id}" no encontrado.`);
    }
    const pdfBuffer =
      await this.certificadosService.generarCertificadoPDF(certificado);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=certificado-${certificado.id}.pdf`,
    });

    res.send(pdfBuffer);
  }

  @Get("usuario/:user_id")
  async getCertificadosByUser(
    @Param("user_id") user_id: string,
  ): Promise<Certificado[]> {
    return this.certificadosService.findByUser(user_id);
  }

  /**
   * @method getJsonLd
   * @description Obtiene un JSON-LD de un certificado, compatible con OpenBadge.
   * @param {string} id - ID del certificado
   * @returns {Promise<Object>} JSON-LD del certificado
   */
  @Get(":id/json-ld")
  @ApiOperation({ summary: "Obtener JSON-LD de un certificado (OpenBadge)" })
  @ApiResponse({ status: 200, description: "JSON-LD generado exitosamente." })
  @ApiResponse({ status: 404, description: "Certificado no encontrado." })
  async getJsonLd(@Param("id") id: string) {
    return this.certificadosService.generateJsonLd(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener un certificado por ID con relaciones" })
  @ApiResponse({
    status: 200,
    description: "Certificado encontrado.",
    type: Certificado,
  })
  @ApiResponse({ status: 404, description: "Certificado no encontrado." })
  async findByIdWithRelations(@Param("id") id: string) {
    return this.certificadosService.findByIdWithRelations(id);
  }

  @Get("listar/simple")
  @ApiOperation({ summary: "Listar certificados (paginado + búsqueda)" })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/Certificado" },
        },
        total: { type: "integer" },
      },
    },
  })
  async listarSimple(
    @Query("badge_id") badgeId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("search") search = "",
  ): Promise<{ items: Certificado[]; total: number }> {
    return this.certificadosService.listarCertificadosSimples(
      badgeId,
      page,
      limit,
      search,
    );
  }
  @Get("listar/organizacion")
  @ApiOperation({
    summary: "Listar certificados por organización (paginado + búsqueda)",
  })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/Certificado" },
        },
        total: { type: "integer" },
      },
    },
  })
  listarPorOrganizacion(
    @Query("organizacion_id") organizacionId: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("search") search = "",
  ): Promise<{ items: Certificado[]; total: number }> {
    return this.certificadosService.listarCertificadosPorOrganizacion(
      organizacionId,
      page,
      limit,
      search,
    );
  }

  // Actualizar un certificado

  @Put(":id")
  @ApiOperation({ summary: "Actualizar un certificado" })
  @ApiResponse({
    status: 200,
    description: "Certificado actualizado con éxito.",
  })
  @ApiResponse({ status: 404, description: "Certificado no encontrado." })
  async update(
    @Param("id") id: string,
    @Body() updateCertificadoDto: UpdateCertificadoDto,
  ) {
    return await this.certificadosService.update(id, updateCertificadoDto);
  }

  // Eliminar un certificado
  @Delete(":id")
  @ApiOperation({ summary: "Eliminar un certificado" })
  @ApiResponse({ status: 200, description: "certificado eliminado con éxito." })
  @ApiResponse({ status: 404, description: "certificado no encontrado." })
  async delete(@Param("id") id: string) {
    return await this.certificadosService.delete(id);
  }

  //
  @Get("assertions/:id")
  @ApiOperation({ summary: "Obtener JSON de Assertion OpenBadge" })
  @ApiResponse({
    status: 200,
    description: "Assertion generada correctamente.",
  })
  async getAssertion(@Param("id") id: string) {
    const assertion = await this.certificadosService.getAssertionJson(id);
    return assertion;
  }
}
