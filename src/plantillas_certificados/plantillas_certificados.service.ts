import { Injectable, NotFoundException, BadRequestException,Inject} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,DataSource } from 'typeorm';
import { PlantillaCertificado } from './plantillas_certificado.entity';
import { Badge } from '../badges/badge.entity';
import { CreatePlantillaCertificadoDto } from './dto/create-plantillas_certificado.dto';
import { AppLoggerService } from 'src/logger/logger.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PlantillasCertificadosService {
  constructor(
    @InjectRepository(PlantillaCertificado)
    private readonly plantillasRepository: Repository<PlantillaCertificado>,

    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>, 

    @Inject(REQUEST)
    private readonly request: Request, 

    private readonly dataSource: DataSource,
    private readonly logger: AppLoggerService 
  ) {}

  async findAll(): Promise<{ items: PlantillaCertificado[]; total: number }> {
    const page   = parseInt(this.request.query.page  as string, 10) || 1;
    const limit  = parseInt(this.request.query.limit as string, 10) || 20;
    const search = (this.request.query.search as string)      || '';

    const qb = this.plantillasRepository
      .createQueryBuilder('plantilla')
      .leftJoinAndSelect('plantilla.badge', 'badge');

    if (search) {
      const term = `%${search}%`;
      qb.where(
        `
          lower(unaccent(plantilla.titulo)) LIKE lower(unaccent(:term))
          OR
          lower(unaccent(badge.nombre))    LIKE lower(unaccent(:term))
        `,
        { term },
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
  async listarPlantillasPorOrganizacion(
    organizacionId: string,
    pageStr  = '1',
    limitStr = '20',
    search   = '',
  ): Promise<{ items: PlantillaCertificado[]; total: number }> {
    const page  = parseInt(pageStr,  10) || 1;
    const limit = parseInt(limitStr, 10) || 20;
    const term  = `%${search}%`;

    const qb = this.plantillasRepository
      .createQueryBuilder('plantilla')
      .leftJoinAndSelect('plantilla.badge', 'badge')
      .select([
        'plantilla.id',
        'plantilla.titulo',
        'plantilla.es_predeterminada',
        'badge.id',
        'badge.nombre'
      ]);

    // Filtrar por organización via badge.issuer_id
    qb.andWhere('badge.issuer_id = :orgId', { orgId: organizacionId });

    if (search) {
      qb.andWhere(
        `
          lower(unaccent(plantilla.titulo)) LIKE lower(unaccent(:term))
          OR lower(unaccent(badge.nombre))    LIKE lower(unaccent(:term))
        `,
        { term },
      );
    }

    qb
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async listarPlantillasSimples() {
    return this.plantillasRepository.createQueryBuilder('plantilla')
      .select([
        'plantilla.id',
        'plantilla.titulo',
        'plantilla.es_predeterminada',
        'badge.id',
        'badge.nombre'
      ])
      .leftJoin('plantilla.badge', 'badge')
      .orderBy('plantilla.titulo', 'ASC')
      .getMany();
  }
  
  async findOne(id: string): Promise<PlantillaCertificado> {
    const plantilla = await this.plantillasRepository.findOne({
      where: { id },
      relations: ['badge'], 
    });
  
    if (!plantilla) {
      this.logger.warn(`Plantilla con ID "${id}" no encontrada.`);
      throw new NotFoundException(`Plantilla con ID "${id}" no encontrada.`);
    }
  
    return plantilla;
  }

  // Crear una nueva plantilla 
  async create(createPlantillaDto: CreatePlantillaCertificadoDto): Promise<PlantillaCertificado> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Creando nueva plantilla para badge ID: ${createPlantillaDto.badge_id}`);
      const badge = await queryRunner.manager.findOne(Badge, { where: { id: createPlantillaDto.badge_id } });

      if (!badge) {
        this.logger.warn(`Badge con ID "${createPlantillaDto.badge_id}" no encontrado.`);
        throw new NotFoundException(`Badge con ID "${createPlantillaDto.badge_id}" no encontrado.`);
      }
      if (createPlantillaDto.es_predeterminada) {
        const plantillaExistente = await queryRunner.manager.findOne(PlantillaCertificado, {
          where: { badge: { id: createPlantillaDto.badge_id }, es_predeterminada: true }
        });
        if (plantillaExistente) {
          this.logger.log(`Desactivando plantilla predeterminada anterior con ID: ${plantillaExistente.id}`);   
          plantillaExistente.es_predeterminada = false;
          await queryRunner.manager.save(PlantillaCertificado, plantillaExistente);
        }
      }
      let plantilla = queryRunner.manager.create(PlantillaCertificado, {
        ...createPlantillaDto,
        badge,
      });
      const plantillaGuardada = await queryRunner.manager.save(PlantillaCertificado, plantilla);
      await queryRunner.commitTransaction();
      return plantillaGuardada;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear la plantilla: ${error.message}`);
      throw new BadRequestException(`Error al crear la plantilla: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }


  async update(id: string, updatePlantillaDto: Partial<PlantillaCertificado>): Promise<PlantillaCertificado> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Actualizando plantilla con ID: ${id}`);
      const plantilla = await queryRunner.manager.findOne(PlantillaCertificado, { where: { id } });
      
      if (!plantilla) {
        this.logger.warn(`Plantilla con ID "${id}" no encontrada.`);
        throw new NotFoundException(`Plantilla con ID "${id}" no encontrada.`);
      }

       if (updatePlantillaDto.es_predeterminada) {
        const plantillaExistente = await queryRunner.manager.findOne(PlantillaCertificado, {
          where: { badge: { id: plantilla.badge.id }, es_predeterminada: true }
        });
        if (plantillaExistente && plantillaExistente.id !== id) {
          this.logger.log(`Desactivando plantilla predeterminada anterior con ID: ${plantillaExistente.id}`);
          plantillaExistente.es_predeterminada = false;
          await queryRunner.manager.save(PlantillaCertificado, plantillaExistente);
        }
      }
      Object.assign(plantilla, updatePlantillaDto);
      await queryRunner.manager.save(PlantillaCertificado, plantilla);
      await queryRunner.commitTransaction();
      return plantilla;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al actualizar la plantilla con ID ${id}: ${error.message}`);
      throw new BadRequestException(`Error al actualizar la plantilla: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }


  async delete(id: string): Promise<void> {
    const plantilla = await this.findOne(id);
    await this.plantillasRepository.remove(plantilla);
    this.logger.log(`Plantilla con ID ${id} eliminada correctamente.`);
  }
}