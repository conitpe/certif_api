import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Badge } from "./badge.entity";
import { CreateBadgeDto } from "./dto/create-badge.dto";
import { UpdateBadgeDto } from "./dto/update-badge.dto";
import { CriterioBadge } from "../criterios/criterio-badge.entity";
import { HabilidadBadge } from "../habilidades/habilidad-badge.entity";
import { AppLoggerService } from "src/logger/logger.service";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Badge)
    private badgesRepository: Repository<Badge>,

    @InjectRepository(CriterioBadge)
    private criteriosBadgesRepository: Repository<CriterioBadge>,

    @InjectRepository(HabilidadBadge)
    private habilidadesBadgesRepository: Repository<HabilidadBadge>,

    @Inject(REQUEST)
    private readonly request: Request,

    private readonly dataSource: DataSource,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(): Promise<{ items: Badge[]; total: number }> {
    const page = parseInt(this.request.query.page as string, 10) || 1;
    const limit = parseInt(this.request.query.limit as string, 10) || 20;
    const search = (this.request.query.search as string) || "";

    const qb = this.badgesRepository
      .createQueryBuilder("badge")
      .leftJoin("badge.issuer", "issuer")
      .select([
        "badge.id",
        "badge.nombre",
        "badge.ruta_imagen",
        "badge.estado",
        "issuer.id",
        "issuer.razon_social",
      ]);

    if (search) {
      const term = `%${search}%`;
      qb.where(
        `
            lower(unaccent(badge.nombre))     LIKE lower(unaccent(:term))
            OR
            lower(unaccent(issuer.razon_social)) LIKE lower(unaccent(:term))
          `,
        { term },
      );
    }
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findByOrganizacion(
    organizacionId: string,
  ): Promise<{ items: Badge[]; total: number }> {
    const page = parseInt(this.request.query.page as string, 10) || 1;
    const limit = parseInt(this.request.query.limit as string, 10) || 20;
    const search = (this.request.query.search as string) || "";

    const qb = this.badgesRepository
      .createQueryBuilder("badge")
      .leftJoin("badge.issuer", "issuer")
      .select([
        "badge.id",
        "badge.nombre",
        "badge.ruta_imagen",
        "badge.estado",
        "issuer.id",
        "issuer.razon_social",
      ])
      .where("issuer.id = :organizacionId", { organizacionId });

    if (search) {
      const term = `%${search}%`;
      qb.andWhere(
        `(
        lower(unaccent(badge.nombre))           LIKE lower(unaccent(:term))
        OR lower(unaccent(issuer.razon_social)) LIKE lower(unaccent(:term))
      )`,
        { term },
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return { items, total };
  }

  //  Obtener todos los badges junto con las certificaciones (para vista pública)
  async findAllWithCertifications(): Promise<Badge[]> {
    return this.badgesRepository.find({
      relations: ["certificados", "certificados.propietario"],
    });
  }

  async findOne(id: string): Promise<Badge> {
    const badge = await this.badgesRepository.findOne({
      where: { id },
      relations: ["habilidades.habilidad"],
    });

    if (!badge) {
      throw new NotFoundException(`Badge con ID "${id}" no encontrado`);
    }

    badge.criterios = await this.criteriosBadgesRepository.find({
      where: { badge_id: id },
      relations: ["criterio"],
    });

    return badge;
  }

  // Crear el Badge con sus relaciones
  async create(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    const { habilidades, criterios, ...badgeData } = createBadgeDto;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Creando badge: ${badgeData.nombre}`);
      const badge = queryRunner.manager.create(Badge, badgeData);
      await queryRunner.manager.save(Badge, badge);

      // Crear las relaciones con las habilidades
      if (habilidades && habilidades.length > 0) {
        const habilidadesBadges = habilidades.map((habilidadId) => ({
          badge: badge,
          habilidad: { id: habilidadId },
        }));
        await queryRunner.manager.save(HabilidadBadge, habilidadesBadges);
      }
      // Crear Criterios asociados
      if (criterios && criterios.length > 0) {
        const criteriosBadges = criterios.map((criterio) => ({
          badge: badge,
          criterio_id: criterio.criterio_id,
          descripcion: criterio.descripcion,
        }));
        await queryRunner.manager.save(CriterioBadge, criteriosBadges);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Badge creado con éxito: ${badge.id}`);
      return badge;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear badge: ${error.message}`);
      throw new Error("Error al crear el badge: " + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async associateCriterio(
    badgeId: string,
    criterioId: string,
  ): Promise<CriterioBadge> {
    const relacion = this.criteriosBadgesRepository.create({
      badge_id: badgeId,
      criterio_id: criterioId,
    });
    return this.criteriosBadgesRepository.save(relacion);
  }

  // Actualizar el Badge con sus relaciones
  async update(id: string, updateBadgeDto: UpdateBadgeDto): Promise<Badge> {
    const { habilidades, criterios, ...badgeData } = updateBadgeDto;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Actualizando badge con ID: ${id}`);
      const badge = await queryRunner.manager.findOne(Badge, { where: { id } });
      if (!badge) {
        this.logger.warn(`Badge con ID "${id}" no encontrado.`);
        throw new NotFoundException(`Badge con ID "${id}" no encontrado`);
      }

      // Actualizar la información del Badge
      Object.assign(badge, badgeData);
      await queryRunner.manager.save(Badge, badge);

      // Eliminar habilidades anteriores y agregar nuevas
      await queryRunner.manager.delete(HabilidadBadge, { badge: { id } });
      if (habilidades && habilidades.length > 0) {
        const habilidadesBadges = habilidades.map((habilidadId) => ({
          badge: badge,
          habilidad: { id: habilidadId },
        }));
        await queryRunner.manager.save(HabilidadBadge, habilidadesBadges);
      }

      // Eliminar criterios anteriores y agregar nuevos
      await queryRunner.manager.delete(CriterioBadge, { badge: { id } });
      if (criterios && criterios.length > 0) {
        const criteriosBadges = criterios.map((criterio) => ({
          badge: badge,
          criterio_id: criterio.criterio_id,
          descripcion: criterio.descripcion,
        }));
        await queryRunner.manager.save(CriterioBadge, criteriosBadges);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Badge actualizado con éxito: ${id}`);
      return badge;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al actualizar badge con ID ${id}: ${error.message}`,
      );
      throw new Error("Error al actualizar el badge: " + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const badge = await this.findOne(id);
    await this.badgesRepository.remove(badge);
    this.logger.log(`Badge con ID ${id} eliminado correctamente.`);
  }

  async getBadgeOpenBadgeFormat(id: string) {
    const cleanId = id.replace(".json", ""); // ✅ elimina la extensión
    const badge = await this.badgesRepository.findOne({
      where: { id: cleanId },
      relations: [
        "criterios",
        "habilidades",
        "habilidades.habilidad",
        "issuer",
      ],
    });

    if (!badge) {
      throw new NotFoundException("Badge no encontrado");
    }

    const criterios = badge.criterios?.map((c) => c.descripcion) || [];

    const habilidades =
      badge.habilidades?.map((h) => ({
        id: h.habilidad.id,
        name: h.habilidad.nombre,
      })) || [];

    return {
      "@context": "https://w3id.org/openbadges/v2",
      type: "BadgeClass",
      id: `https://api.certif.digital/badges/openbadge/${badge.id}`,
      name: badge.nombre,
      description: badge.descripcion,
      image:
        badge.ruta_imagen || "https://api.certif.digital/default-badge.png",
      criteria: {
        narrative: "Criterios de obtención del badge.",
        detalles: criterios,
      },
      skill: habilidades,
      issuer: `https://api.certif.digital/organizaciones/${badge.issuer.id}`,
    };
  }
}
