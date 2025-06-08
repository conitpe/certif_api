import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository, In, DataSource } from "typeorm";
import { Usuario } from "./usuario.entity";
import { Certificado } from "../certificados/certificado.entity";
import { Organizacion } from "src/organizaciones/organizacion.entity";
import { AppLoggerService } from "src/logger/logger.service";
import { randomBytes } from "crypto";
import { verificacionCorreoTemplate } from "../mail/templates/verificacion.template";
import { ConfigService } from "@nestjs/config";
import { MailService } from "../mail/mail.service";

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Organizacion)
    private readonly organizacionRepository: Repository<Organizacion>,

    private readonly dataSource: DataSource,
    private readonly logger: AppLoggerService,

    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async findByOrganizacion(organizacionId: string): Promise<Usuario[]> {
    return this.usuariosRepository.find({
      where: { organizacion: { id: organizacionId } },
      relations: ["organizacion"],
    });
  }
  async findBeneficiariosConCertificados(
    organizacionId: string,
  ): Promise<Usuario[]> {
    return this.usuariosRepository
      .createQueryBuilder("usuario")
      .leftJoin("usuario.certificados", "certificado")
      .leftJoin("certificado.badge", "badge")
      .where("usuario.rol = :rol", { rol: "beneficiario" })
      .andWhere("badge.issuer_id = :organizacionId", { organizacionId })
      .getMany();
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find();
  }

 // usuarios.service.ts

async findUsuariosVinculados(
  organizacionId: string,
  pageStr  = "1",
  limitStr = "20",
  search   = "",
): Promise<{ items: Usuario[]; total: number }> {
  const page  = parseInt(pageStr,  10) || 1;
  const limit = parseInt(limitStr, 10) || 20;
  const term  = `%${search}%`;

  const qb = this.usuariosRepository
    .createQueryBuilder("usuario")
    .select([
      "usuario.id",
      "usuario.nombre",
      "usuario.apellido",
      "usuario.email",
      "usuario.creado_en",  
      "usuario.rol",  
    ])
    .innerJoin("usuario.organizaciones", "org")
    .where("org.id = :organizacionId", { organizacionId });

  if (search) {
    qb.andWhere(
      `
        lower(unaccent(usuario.nombre))    LIKE lower(unaccent(:term))
        OR lower(unaccent(usuario.apellido)) LIKE lower(unaccent(:term))
        OR lower(unaccent(usuario.email))    LIKE lower(unaccent(:term))
      `,
      { term },
    );
  }

  qb.orderBy("usuario.creado_en", "DESC")
    .skip((page - 1) * limit)
    .take(limit);

  const [items, total] = await qb.getManyAndCount();
  return { items, total };
}

  async listarBeneficiarios(
    rol: string,
    pageStr  = '1',
    limitStr = '20',
    search   = '',
  ): Promise<{ items: Usuario[]; total: number }> {
    const page  = parseInt(pageStr, 10)  || 1;
    const limit = parseInt(limitStr, 10) || 20;
    const term  = `%${search}%`;

    const qb = this.usuariosRepository
      .createQueryBuilder('usuario')
      .select(['usuario.id','usuario.nombre','usuario.apellido','usuario.email'])
      .where('usuario.rol = :rol', { rol });

    if (search) {
      qb.andWhere(
        `
          lower(unaccent(usuario.nombre))    LIKE lower(unaccent(:term))
          OR lower(unaccent(usuario.apellido)) LIKE lower(unaccent(:term))
          OR lower(unaccent(usuario.email))    LIKE lower(unaccent(:term))
        `,
        { term },
      );
    }

    qb.orderBy('usuario.creado_en','DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /**
   * Lista beneficiarios con certificados de una org (paginado + búsqueda)
   */
  async listarBeneficiariosConCertificados(
    organizacionId: string,
    pageStr  = '1',
    limitStr = '20',
    search   = '',
  ): Promise<{ items: Usuario[]; total: number }> {
    const page  = parseInt(pageStr, 10)  || 1;
    const limit = parseInt(limitStr, 10) || 20;
    const term  = `%${search}%`;

    const qb = this.usuariosRepository
      .createQueryBuilder('usuario')
      .select(['usuario.id','usuario.nombre','usuario.apellido','usuario.email'])
      .leftJoin('usuario.certificados','certificado')
      .leftJoin('certificado.badge','badge')
      .where('usuario.rol = :rol',{ rol:'beneficiario' })
      .andWhere('badge.issuer_id = :orgId',{ orgId:organizacionId });

    if (search) {
      qb.andWhere(
        `
          lower(unaccent(usuario.nombre))     LIKE lower(unaccent(:term))
          OR lower(unaccent(usuario.apellido))  LIKE lower(unaccent(:term))
          OR lower(unaccent(usuario.email))     LIKE lower(unaccent(:term))
        `,
        { term },
      );
    }

    qb.orderBy('usuario.creado_en','DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
  async create(
    usuarioData: Partial<Usuario> & { organizacion_id?: string },
  ): Promise<Usuario> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Creando usuario: ${usuarioData.email}`);

    const emailNorm = usuarioData.email?.trim().toLowerCase();
    if (!emailNorm) {
      throw new BadRequestException(`El email es obligatorio.`);
    }
    const existente = await queryRunner.manager.findOne(Usuario, {
      where: { email: emailNorm },
    });
    if (existente) {
      throw new BadRequestException(
        `El correo "${emailNorm}" ya está registrado.`,
      );
    }

    this.logger.log(`Creando usuario: ${emailNorm}`);

      if (usuarioData.contrasena) {
        const salt = await bcrypt.genSalt();
        usuarioData.contrasena = await bcrypt.hash(
          usuarioData.contrasena,
          salt,
        );
      }

      const tokenVerificacion = randomBytes(32).toString("hex");

      const orgId = (usuarioData as any).organizacion_id;
      let organizacion: Organizacion = null;
      if (orgId) {
        organizacion = await queryRunner.manager.findOne(Organizacion, {
          where: { id: orgId },
        });
        if (!organizacion) {
          throw new NotFoundException(
            `Organización con ID "${orgId}" no encontrada.`,
          );
        }
      }
      const nuevoUsuario = queryRunner.manager.create(Usuario, {
        ...usuarioData,
        organizacion: organizacion,
        verificado: false,
        token_verificacion: tokenVerificacion,
      });

      const usuarioGuardado = await queryRunner.manager.save(
        Usuario,
        nuevoUsuario,
      );
      this.logger.log(`Usuario creado con ID: ${usuarioGuardado.id}`);

      if (organizacion) {
        await queryRunner.manager
          .createQueryBuilder()
          .relation(Usuario, "organizaciones")
          .of(usuarioGuardado.id)
          .add(organizacion.id);
        this.logger.log(
          `Vinculada la org ${organizacion.id} al usuario ${usuarioGuardado.id}`,
        );
      }

      const frontendUrl = this.configService.get<string>("FRONTEND_URL");
      const urlVerificacion = `${frontendUrl}/verificar?token=${tokenVerificacion}`;
      const emailTemplate = verificacionCorreoTemplate(
        nuevoUsuario.nombre,
        urlVerificacion,
      );
      await this.mailService.sendMail(
        nuevoUsuario.email,
        emailTemplate.subject,
        emailTemplate.text,
      );

      await queryRunner.commitTransaction();
      return usuarioGuardado;
    } catch (error) {
      this.logger.error(`Error al crear usuario: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Error al crear el usuario: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findByEmail(email: string): Promise<Usuario> {
    return await this.usuariosRepository.findOne({
      where: { email },
      relations: ["organizacion"],
    });
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: ["organizacion"],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    return usuario;
  }

  async update(id: string, usuarioData: Partial<Usuario>): Promise<Usuario> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const usuario = await queryRunner.manager.findOne(Usuario, {
        where: { id },
      });
      if (!usuario)
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
      if (usuarioData.contrasena) {
        const salt = await bcrypt.genSalt();
        usuarioData.contrasena = await bcrypt.hash(
          usuarioData.contrasena,
          salt,
        );
      }
      if (usuarioData.organizacion) {
        const organizacion = await queryRunner.manager.findOne(Organizacion, {
          where: { id: usuarioData.organizacion.id },
        });

        if (!organizacion) {
          throw new NotFoundException(
            `Organización con ID "${usuarioData.organizacion.id}" no encontrada.`,
          );
        }
        usuario.organizacion = organizacion;
      }
      Object.assign(usuario, usuarioData);
      await queryRunner.manager.save(Usuario, usuario);
      await queryRunner.commitTransaction();
      return usuario;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear actualizar: ${error.message}`);
      throw new BadRequestException(
        `Error al actualizar el usuario: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuariosRepository.remove(usuario);
  }

  async findByRole(role: string): Promise<Usuario[]> {
    const usuarios = await this.usuariosRepository.find({
      where: { rol: role },
    });
    return usuarios;
  }

  async findByRoles(roles: string[]): Promise<Usuario[]> {
    return this.usuariosRepository.find({
      where: { rol: In(roles) },
    });
  }

  async buscarPorCorreo(email: string): Promise<Usuario | null> {
    const usuario = await this.usuariosRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: ["organizacion"],
    });

    if (!usuario) {
      return null;
    }
    return usuario;
  }
  async asignarOrganizacion(
    usuarioId: string,
    organizacionId: string,
  ): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .relation(Usuario, 'organizaciones')     // nombre de la propiedad ManyToMany en Usuario
      .of(usuarioId)
      .add(organizacionId);
  }
}
