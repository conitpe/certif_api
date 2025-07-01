import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createReadStream } from "fs";
import { parse } from "node-html-parser";
import { join } from "path";
import { Certificado } from "./certificado.entity";
import { Usuario } from "../usuarios/usuario.entity";
import { Badge } from "../badges/badge.entity";
import { PlantillaCertificado } from "../plantillas_certificados/plantillas_certificado.entity";
import { CreateCertificadoDto } from "./dto/create-certificado.dto";
import { UpdateCertificadoDto } from "./dto/update-certificado.dto";
import { Raw, DataSource } from "typeorm";
import { readFile } from "fs/promises";
import { URL } from "url";
import { existsSync } from "fs";
import { extname } from "path";
import { Organizacion } from "src/organizaciones/organizacion.entity";
import * as QRCode from "qrcode";
import { Buffer } from "buffer";
import { AppLoggerService } from "src/logger/logger.service";
//Envio de Email
import { MailService } from "../mail/mail.service";
import { certificadoTemplate } from "../mail/templates/certificado.template";
import { bienvenidaTemplate } from "../mail/templates/bienvenida.template";

import { REQUEST } from "@nestjs/core";
import { Request } from "express";

import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";

import * as fs from "fs";
import * as path from "path";
const extractChunks = require("png-chunks-extract");
const encodeChunks = require("png-chunks-encode");
const createTextChunk = require("png-chunk-text").encode;

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,

    @Inject(REQUEST) private readonly request: Request,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,

    @InjectRepository(PlantillaCertificado)
    private readonly plantillaRepository: Repository<PlantillaCertificado>,

    @InjectRepository(Organizacion)
    private readonly organizacionRepository: Repository<Organizacion>,

    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * @method generateJsonLd
   * @description Genera un JSON-LD para un certificado, compatible con el estándar OpenBadge.
   * @param {string} id - ID del certificado
   * @returns {Promise<Object>} JSON-LD compatible con OpenBadge
   */
  async generateJsonLd(id: string) {
    const certificado = await this.certificadoRepository.findOne({
      where: { id },
      relations: [
        "badge",
        "badge.criterios",
        "badge.habilidades",
        "badge.habilidades.habilidad",
        "badge.issuer",
      ],
    });

    if (!certificado) {
      throw new NotFoundException("Certificado no encontrado");
    }

    let recipientData: { email: string; nombre: string };
    try {
      recipientData =
        typeof certificado.recipient === "string"
          ? JSON.parse(certificado.recipient)
          : certificado.recipient;
    } catch (error) {
      throw new NotFoundException("Error al procesar los datos del recipient");
    }

    const { badge } = certificado;

    const criterios =
      badge.criterios?.map((criterio) => ({
        id: criterio.id,
        descripcion: criterio.descripcion,
      })) || [];

    const habilidades =
      badge.habilidades?.map((habilidadBadge) => ({
        id: habilidadBadge.habilidad.id,
        nombre: habilidadBadge.habilidad.nombre,
      })) || [];

    const issuer = {
      id: `https://certif.digital/organizaciones/${badge.issuer.id}`,
      type: "Issuer",
      name:
        badge.issuer.razon_social || "Nombre de la organización no disponible",
      url: badge.issuer.url_web || "https://certif.digital",
      email: badge.issuer.email_contacto || "contacto@certif.digital",
    };

    return {
      "@context": "https://w3id.org/openbadges/v2",
      type: "Assertion",
      id: `https://certif.digital/certificados/${id}`,
      recipient: {
        identity: recipientData.email || "email-no-disponible",
        type: "email",
        hashed: false,
      },
      badge: {
        id: `https://certif.digital/badges/metadata/${badge.id}`,
        type: "BadgeClass",
        name: badge.nombre || "Nombre no disponible",
        description: badge.descripcion || "Descripción no disponible",
        criteria: {
          narrative:
            "Este badge es otorgado por completar los criterios establecidos.",
          detalles: criterios,
        },
        skills: habilidades,
        issuer: issuer,
        image: badge.ruta_imagen || "https://certif.digital/default-badge.png",
      },
      verification: {
        type: "HostedBadge",
      },
      issuedOn: certificado.issued_on
        ? certificado.issued_on.toISOString()
        : new Date().toISOString(),
      recipientName: recipientData.nombre || "Nombre no disponible",
    };
  }

  async getAssertionJson(id: string) {
    const certificado = await this.certificadoRepository.findOne({
      where: { id },
      relations: [
        "badge",
        "badge.criterios",
        "badge.habilidades",
        "badge.habilidades.habilidad",
        "badge.issuer",
      ],
    });

    if (!certificado) {
      throw new NotFoundException("Certificado no encontrado");
    }

    let recipientData: { email: string; nombre: string };
    try {
      recipientData =
        typeof certificado.recipient === "string"
          ? JSON.parse(certificado.recipient)
          : certificado.recipient;
    } catch (error) {
      throw new NotFoundException("Error al procesar los datos del recipient");
    }

    const assertion = {
      "@context": "https://w3id.org/openbadges/v2",
      type: "Assertion",
      id: `https://api.certif.digital/certificados/assertions/${certificado.id}`,
      recipient: {
        type: "email",
        hashed: false,
        identity: recipientData.email,
      },
      badge: `https://api.certif.digital/badges/${certificado.badge.id}.json`,
      issuedOn: new Date(certificado.fecha_emision).toISOString(),

      verification: {
        type: "HostedBadge",
      },
      issuer: `https://api.certif.digital/organizaciones/${certificado.badge.issuer.id}`,
    };

    return assertion;
  }

  async generarCertificadoPDF(certificado: Certificado): Promise<Buffer> {
    if (!certificado)
      throw new NotFoundException(
        `El certificado con ID "${certificado.id}" no existe.`,
      );
    if (!certificado.plantilla)
      throw new NotFoundException(
        `El certificado con ID "${certificado.id}" no tiene una plantilla asociada.`,
      );

    const plantilla = certificado.plantilla;

    const ancho = 1000;
    let alto = 707;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([ancho, alto]);

    if (plantilla.ruta_fondo) {
      let imagePath = plantilla.ruta_fondo;
      if (imagePath.startsWith("http")) {
        const urlObj = new URL(imagePath);
        imagePath = join(
          __dirname,
          "../../uploads",
          urlObj.pathname.split("/").pop(),
        );
      }

      if (!existsSync(imagePath)) {
        throw new NotFoundException(
          `La imagen de fondo no existe en la ruta: ${imagePath}`,
        );
      }

      const imageBytes = await readFile(imagePath);
      const fileExtension = extname(imagePath).toLowerCase();
      let image;
      if (fileExtension === ".jpg" || fileExtension === ".jpeg") {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (fileExtension === ".png") {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        throw new Error(`Formato de imagen no soportado: ${fileExtension}`);
      }

      page.drawImage(image, { x: 0, y: 0, width: ancho, height: alto });
    }

    const qrUrl = `https://certif.digital/beneficiario/certificado/${certificado.id}`;
    const qrBuffer = await QRCode.toBuffer(qrUrl);
    // 🔹 **3. Incrustar el QR en el PDF**
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const qrX = plantilla.ubicacion_qr_x ?? 80;
    const qrY = alto - (plantilla.ubicacion_qr_y ?? 500) - 100;

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: 100,
      height: 100,
    });

    const beneficiario = certificado.propietario;
    if (!beneficiario) {
      throw new NotFoundException(
        `No se encontró el beneficiario del certificado con ID "${certificado.id}".`,
      );
    }

    const nombreCompleto = `${beneficiario.nombre} ${beneficiario.apellido}`;

    const nombreX = plantilla.ubicacion_nombre_x ?? 400;
    const nombreY = alto - (plantilla.ubicacion_nombre_y ?? 200);

    const fechaX = plantilla.fecha_emision_x ?? 400;
    const fechaY = alto - (plantilla.fecha_emision_y ?? 300);

    const idCertificadoX = plantilla.id_certificado_x ?? 80;
    const idCertificadoY = alto - (plantilla.id_certificado_y ?? 600) - 20;

    const badgeX = plantilla.badge_x ?? 800;
    const badgeY = alto - (plantilla.badge_y ?? 50) - 100;

    let fechaEmision = certificado.fecha_emision;
    if (typeof fechaEmision === "string" || fechaEmision === null) {
      fechaEmision = new Date(fechaEmision);
    }
    if (!(fechaEmision instanceof Date) || isNaN(fechaEmision.getTime())) {
      throw new Error(
        `El campo fecha_emision no es una fecha válida: ${certificado.fecha_emision}`,
      );
    }
    const fechaEmisionStr = this.convertirFechaTexto(fechaEmision);

    const ajusteNombreX = 30;
    const ajusteNombreY = -20;

    const ajusteFechaX = 50;
    const ajusteFechaY = -20;

    this.dibujarTextoDesdeHTML(
      page,
      nombreCompleto,
      nombreX,
      nombreY,
      plantilla.contenido_nombre,
      ancho,
      ajusteNombreX,
      ajusteNombreY,
    );
    this.dibujarTextoDesdeHTML(
      page,
      fechaEmisionStr,
      fechaX,
      fechaY,
      plantilla.contenido_fecha_emision,
      ancho,
      ajusteFechaX,
      ajusteFechaY,
    );

    page.drawText(certificado.id, {
      x: idCertificadoX,
      y: idCertificadoY,
      size: 12,
      font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      color: rgb(0, 0, 0),
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: 100,
      height: 100,
    });

    if (certificado.badge?.ruta_imagen) {
      const badgeImageBytes = await this.descargarImagen(
        certificado.badge.ruta_imagen,
      );

      const fileExtension = certificado.badge.ruta_imagen
        .split(".")
        .pop()
        ?.toLowerCase();

      let badgeImage;
      if (fileExtension === "jpg" || fileExtension === "jpeg") {
        badgeImage = await pdfDoc.embedJpg(badgeImageBytes);
      } else if (fileExtension === "png") {
        badgeImage = await pdfDoc.embedPng(badgeImageBytes);
      } else {
        this.logger.error(
          `El archivo de imagen no es un formato válido: ${fileExtension}`,
        );
        throw new Error(
          `El archivo de imagen no es un formato válido: ${fileExtension}`,
        );
      }
      page.drawImage(badgeImage, {
        x: badgeX,
        y: badgeY,
        width: 100,
        height: 100,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private async descargarImagen(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen desde ${url}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  private dibujarTextoDesdeHTML(
    page,
    texto: string,
    x: number,
    y: number,
    html: string,
    ancho: number,
    ajusteX = 0,
    ajusteY = 0,
  ) {
    if (!html) return;

    const parsedHtml = parse(html).querySelector("span");
    if (!parsedHtml) return;

    const fontSize = parseInt(
      parsedHtml.getAttribute("style")?.match(/font-size:\s*(\d+)px/i)?.[1] ||
        "16",
      10,
    );
    const colorHex =
      parsedHtml
        .getAttribute("style")
        ?.match(/color:\s*(#[0-9A-Fa-f]+)/i)?.[1] || "#000000";
    const fontFamily =
      parsedHtml.getAttribute("style")?.match(/font-family:\s*([^;]+)/i)?.[1] ||
      "Helvetica";

    const colorRGB = this.hexToRgb(colorHex);

    const font = page.doc.embedStandardFont(
      fontFamily.includes("Courier")
        ? "Courier"
        : fontFamily.includes("Times")
          ? "Times-Roman"
          : "Helvetica",
    );

    const textWidth = font.widthOfTextAtSize(texto, fontSize);
    const adjustedX = x - textWidth / 2 + ajusteX;

    page.drawText(texto, {
      x: adjustedX,
      y: y + ajusteY,
      size: fontSize,
      font: font,
      color: rgb(colorRGB.r / 255, colorRGB.g / 255, colorRGB.b / 255),
    });
  }

  private convertirFechaTexto(fecha: Date): string {
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  }

  private hexToRgb(hex: string) {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
  }

  async emitirCertificado(
    createCertificadoDto: CreateCertificadoDto,
  ): Promise<Certificado> {
    const {
      propietario,
      badge_id,
      plantilla_certificado_id,
      fecha_expiracion,
    } = createCertificadoDto;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(
        `Iniciando emisión de certificado para: ${propietario.email}`,
      );

      const frontendUrl = this.configService.get<string>("FRONTEND_URL");
      const backendUrl =
        this.configService.get<string>("BACKEND_URL") ||
        "http://localhost:3000";

      let usuario = await queryRunner.manager.findOne(Usuario, {
        where: [{ dni: propietario.dni }, { email: propietario.email }],
        relations: ["organizacion"],
      });

      let organizacion = null;
      if (propietario.organizacion_id) {
        organizacion = await queryRunner.manager.findOne(Organizacion, {
          where: { id: propietario.organizacion_id },
        });
        if (!organizacion) {
          this.logger.warn(
            `Organización con ID "${propietario.organizacion_id}" no encontrada.`,
          );
          throw new NotFoundException(
            `Organización con ID "${propietario.organizacion_id}" no encontrada.`,
          );
        }
      }

      let esNuevoUsuario = false;
      let resetToken = null;

      if (!usuario) {
        esNuevoUsuario = true;
        resetToken = crypto.randomBytes(32).toString("hex");
        usuario = queryRunner.manager.create(Usuario, {
          ...propietario,
          organizacion,
          resetPasswordToken: resetToken,
        });
        usuario = await queryRunner.manager.save(Usuario, usuario);
        if (organizacion) {
          await queryRunner.manager
            .createQueryBuilder()
            .relation(Usuario, "organizaciones")
            .of(usuario.id)
            .add(organizacion.id);
        }
      } else if (!usuario.organizacion && organizacion) {
        usuario.organizacion = organizacion;
        await queryRunner.manager.save(Usuario, usuario);
        await queryRunner.manager
          .createQueryBuilder()
          .relation(Usuario, "organizaciones")
          .of(usuario.id)
          .add(organizacion.id);
      }

      const badge = await queryRunner.manager.findOne(Badge, {
        where: { id: badge_id },
      });
      if (!badge) {
        this.logger.warn(`Badge con ID "${badge_id}" no encontrado.`);
        throw new NotFoundException(
          `Badge con ID "${badge_id}" no encontrado.`,
        );
      }

      let plantilla = null;
      if (plantilla_certificado_id) {
        plantilla = await queryRunner.manager.findOne(PlantillaCertificado, {
          where: { id: plantilla_certificado_id },
        });
      } else {
        plantilla = await queryRunner.manager.findOne(PlantillaCertificado, {
          where: { badge: { id: badge_id }, es_predeterminada: true },
        });
      }

      if (!plantilla) {
        this.logger.warn(
          `No se encontró una plantilla predeterminada para el badge con ID "${badge_id}".`,
        );
        throw new BadRequestException("plantilla predeterminada");
        throw new NotFoundException(
          `No se encontró una plantilla predeterminada para el badge con ID "${badge_id}".`,
        );
      }

      const certificado = queryRunner.manager.create(Certificado, {
        propietario: usuario,
        badge,
        plantilla,
        fecha_emision: new Date(),
        fecha_expiracion: fecha_expiracion || null,
        estado: "aceptado",
        recipient: {
          nombre: propietario.nombre,
          email: propietario.email,
        },
      });

      const certificadoGuardado = await queryRunner.manager.save(
        Certificado,
        certificado,
      );

      try {
        const nombreImagenOriginal = badge.ruta_imagen.split("/").pop();
        const rutaImagenOriginal = path.join(
          process.cwd(),
          "uploads",
          nombreImagenOriginal,
        );
        const nombreImagenFinal = `badge-final-${certificadoGuardado.id}.png`;
        const rutaImagenFinal = path.join(
          process.cwd(),
          "uploads",
          nombreImagenFinal,
        );

        const assertion = {
          "@context": "https://w3id.org/openbadges/v2",
          type: "Assertion",
          id: `https://api.certif.digital/certificados/assertions/${certificadoGuardado.id}`,
          recipient: {
            type: "email",
            hashed: false,
            identity: usuario.email,
          },
          badge: `https://api.certif.digital/badges/openbadge/${badge.id}.json`,
          issuedOn: certificadoGuardado.fecha_emision.toISOString(),
          verification: { type: "HostedBadge" },
          issuer: `https://api.certif.digital/organizaciones/${usuario.organizacion?.id || "default"}`,
        };

        const bufferOriginal = fs.readFileSync(rutaImagenOriginal);
        const chunks = extractChunks(bufferOriginal);
        const textChunk = createTextChunk(
          "openbadge",
          JSON.stringify(assertion),
        );
        chunks.splice(chunks.length - 1, 0, textChunk);
        const bufferFinal = Buffer.from(encodeChunks(chunks));
        fs.writeFileSync(rutaImagenFinal, bufferFinal);

        certificadoGuardado.ruta_insignia = `${backendUrl}/uploads/${nombreImagenFinal}`;

        certificadoGuardado.metadata = {
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            dni: usuario.dni,
          },
          badge: {
            id: badge.id,
            nombre: badge.nombre,
            descripcion: badge.descripcion,
            ruta_imagen: `${backendUrl}/uploads/${nombreImagenFinal}`,
          },
          plantilla: {
            id: plantilla.id,
            nombre: plantilla.nombre,
            ruta_fondo: plantilla.ruta_fondo,
          },
        };

        await queryRunner.manager.save(Certificado, certificadoGuardado);
      } catch (err) {
        this.logger.error(`Error al bakear la imagen: ${err.message}`);
      }

      this.logger.log(
        `Certificado emitido con éxito: ${certificadoGuardado.id} para ${usuario.email}`,
      );

      const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
      const email = usuario.email;
      const linkCertificado = `${frontendUrl}/beneficiario/certificado/${certificadoGuardado.id}`;
      const linkRestablecer = resetToken
        ? `${frontendUrl}/recuperar/${resetToken}`
        : null;

      if (esNuevoUsuario) {
        const bienvenida = bienvenidaTemplate(nombreCompleto, linkRestablecer);
        await this.mailService.sendMail(
          email,
          bienvenida.subject,
          bienvenida.text,
        );
      }

      const certificadoEmail = certificadoTemplate(
        nombreCompleto,
        linkCertificado,
      );
      await this.mailService.sendMail(
        email,
        certificadoEmail.subject,
        certificadoEmail.text,
      );

      await queryRunner.commitTransaction();
      return certificadoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al emitir el certificado: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException("Error al emitir el certificado");
    } finally {
      await queryRunner.release();
    }
  }

  async listarCertificadosSimples(
    badgeId?: string,
    pageStr = "1",
    limitStr = "20",
    search = "",
  ): Promise<{ items: Certificado[]; total: number }> {
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 20;

    const qb = this.certificadoRepository
      .createQueryBuilder("certificado")
      .leftJoinAndSelect("certificado.propietario", "propietario")
      .leftJoinAndSelect("certificado.badge", "badge");

    if (badgeId) {
      qb.andWhere("badge.id = :badgeId", { badgeId });
    }

    if (search) {
      const term = `%${search}%`;
      qb.andWhere(
        `(
          lower(unaccent(propietario.nombre))    LIKE lower(unaccent(:term))
          OR lower(unaccent(propietario.apellido))  LIKE lower(unaccent(:term))
          OR lower(unaccent(badge.nombre))         LIKE lower(unaccent(:term))
          OR certificado.estado::varchar           ILIKE :term
          OR to_char(certificado.fecha_emision, 'YYYY-MM-DD') ILIKE :term
         )`,
        { term },
      );
    }

    qb.orderBy("certificado.fecha_emision", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async listarCertificadosPorOrganizacion(
    organizacionId: string,
    pageStr = "1",
    limitStr = "20",
    search = "",
  ): Promise<{ items: Certificado[]; total: number }> {
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 20;
    const term = `%${search}%`;

    const qb = this.certificadoRepository
      .createQueryBuilder("certificado")
      .leftJoinAndSelect("certificado.propietario", "propietario")
      .leftJoinAndSelect("certificado.badge", "badge")
      .select([
        "certificado.id",
        "certificado.fecha_emision",
        "certificado.estado",
        "badge.id",
        "badge.nombre",
        "propietario.nombre",
        "propietario.apellido",
      ]);
    // Filtrar por organización del badge
    qb.andWhere("badge.issuer_id = :orgId", { orgId: organizacionId });

    if (search) {
      qb.andWhere(
        `(
          lower(unaccent(propietario.nombre))    LIKE lower(unaccent(:term))
          OR lower(unaccent(propietario.apellido))  LIKE lower(unaccent(:term))
          OR lower(unaccent(badge.nombre))         LIKE lower(unaccent(:term))
          OR certificado.estado::varchar           ILIKE :term
          OR to_char(certificado.fecha_emision,'YYYY-MM-DD') ILIKE :term
         )`,
        { term },
      );
    }

    qb.orderBy("certificado.fecha_emision", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async update(
    id: string,
    updateCertificadoDto: UpdateCertificadoDto,
  ): Promise<Certificado> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`🟠 Actualizando certificado con ID: ${id}`);

      const certificado = await queryRunner.manager.findOne(Certificado, {
        where: { id },
      });
      if (!certificado) {
        this.logger.warn(`⚠️ Certificado con ID "${id}" no encontrado.`);
        throw new NotFoundException(
          `Certificado con ID "${id}" no encontrado.`,
        );
      }

      if (updateCertificadoDto.propietario) {
        let usuario = await queryRunner.manager.findOne(Usuario, {
          where: [
            { email: updateCertificadoDto.propietario.email },
            { dni: updateCertificadoDto.propietario.dni },
          ],
        });

        if (!usuario) {
          usuario = queryRunner.manager.create(Usuario, {
            ...updateCertificadoDto.propietario,
          });
          usuario = await queryRunner.manager.save(Usuario, usuario);
          this.logger.log(`✅ Nuevo propietario creado: ${usuario.email}`);
        }

        certificado.propietario = usuario;
      }

      Object.assign(certificado, updateCertificadoDto);
      await queryRunner.manager.save(Certificado, certificado);

      await queryRunner.commitTransaction();
      this.logger.log(`✅ Certificado con ID ${id} actualizado correctamente.`);
      return certificado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al actualizar el certificado con ID ${id}: ${error.message}`,
      );
      throw new Error(`Error al actualizar el certificado: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const certificado = await queryRunner.manager.findOne(Certificado, {
        where: { id },
      });
      if (!certificado) {
        this.logger.warn(`⚠️ Certificado con ID "${id}" no encontrado.`);
        throw new NotFoundException(
          `Certificado con ID "${id}" no encontrado.`,
        );
      }

      await queryRunner.manager.remove(Certificado, certificado);

      await queryRunner.commitTransaction();
      this.logger.log(`Certificado con ID ${id} eliminado correctamente.`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al eliminar el certificado con ID ${id}: ${error.message}`,
      );
      throw new Error(`Error al eliminar el certificado: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Certificado[]> {
    return this.certificadoRepository.find({
      relations: ["propietario", "badge", "plantilla"],
    });
  }

  async findAllByBadge(badge_id: string): Promise<Certificado[]> {
    console.log("Recibiendo badge_id:", badge_id);

    return this.certificadoRepository
      .createQueryBuilder("certificado")
      .innerJoinAndSelect("certificado.badge", "badge")
      .where("badge.id = :badge_id::uuid", { badge_id })
      .leftJoinAndSelect("certificado.propietario", "propietario")
      .leftJoinAndSelect("certificado.plantilla", "plantilla")
      .getMany();
  }
  // Función para obtener un certificado por IDs
  async findOne(id: string): Promise<Certificado> {
    const certificado = await this.certificadoRepository.findOne({
      where: { id },
      relations: ["propietario", "badge", "plantilla"],
    });

    if (!certificado) {
      throw new NotFoundException(`Certificado con ID "${id}" no encontrado.`);
    }

    return certificado;
  }
  /*Certificados por Usuario */
  async findByUser(user_id: string): Promise<Certificado[]> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: user_id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${user_id}" no encontrado.`);
    }

    return this.certificadoRepository.find({
      where: { propietario: { id: user_id } },
      relations: [
        "badge",
        "badge.issuer",
        "badge.habilidades",
        "badge.habilidades.habilidad",
        "badge.criterios",
        "badge.criterios.criterio",
        "plantilla",
      ],
    });
  }
  /**Obtener certiifcadocon relacion */
  async findByIdWithRelations(id: string): Promise<Certificado> {
    const certificado = await this.certificadoRepository.findOne({
      where: { id },
      relations: [
        "propietario",
        "badge",
        "badge.issuer",
        "badge.habilidades",
        "badge.habilidades.habilidad",
        "badge.criterios",
        "badge.criterios.criterio",
      ],
    });

    if (!certificado) {
      throw new NotFoundException(`Certificado con ID "${id}" no encontrado.`);
    }

    return certificado;
  }
}
