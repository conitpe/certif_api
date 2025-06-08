import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource,ILike } from 'typeorm';
import { Organizacion } from './organizacion.entity';
import { CreateOrganizacionDto } from './dto/create-organizacion.dto';
import { UpdateOrganizacionDto } from './dto/update-organizacion.dto';
import { AppLoggerService } from 'src/logger/logger.service';

@Injectable()
export class OrganizacionesService {
  constructor(
    @InjectRepository(Organizacion)
    private organizacionesRepository: Repository<Organizacion>,
    private readonly dataSource: DataSource,
    private readonly logger: AppLoggerService
  ) { }

  async findAll(): Promise<Organizacion[]> {
    return this.organizacionesRepository.find();
  }
// organizaciones.service.ts

async listarOrganizaciones(
  pageStr  = "1",
  limitStr = "20",
  search   = "",
): Promise<{ items: Organizacion[]; total: number }> {
  const page  = parseInt(pageStr,  10) || 1;
  const limit = parseInt(limitStr, 10) || 20;
  const term  = `%${search}%`;

  const qb = this.organizacionesRepository
    .createQueryBuilder("org")
    .select([
      "org.id",
      "org.razon_social",
      "org.tipo",
      "org.url_web",
      "org.email_contacto",
    ]);

  if (search) {
    qb.where(
      `
        lower(unaccent(org.razon_social))     LIKE lower(unaccent(:term))
        OR lower(unaccent(org.tipo))           LIKE lower(unaccent(:term))
        OR lower(unaccent(org.url_web))        LIKE lower(unaccent(:term))
        OR lower(unaccent(org.email_contacto)) LIKE lower(unaccent(:term))
      `,
      { term },
    );
  }

  qb.orderBy("org.creado_en", "DESC")
    .skip((page - 1) * limit)
    .take(limit);

  const [items, total] = await qb.getManyAndCount();
  return { items, total };
}


  async buscar(termino: string): Promise<Organizacion[]> {
    const term = `%${termino}%`;
    return this.organizacionesRepository
      .createQueryBuilder('org')
      .where(
        'unaccent(org.razon_social) ILIKE unaccent(:term)',
        { term },
      )
      .getMany();
  }
  
  async findOne(id: string): Promise<Organizacion> {
    const organizacion = await this.organizacionesRepository.findOne({ where: { id } });
    if (!organizacion) {
      this.logger.warn(`Organización con ID "${id}" no encontrada.`);
      throw new NotFoundException(`Organización con ID "${id}" no encontrada`);
    }
    return organizacion;
  }

  

  // Crear la organización
  async create(createOrganizacionDto: CreateOrganizacionDto): Promise<Organizacion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      this.logger.log(`Creando nueva organización`);
      const organizacion = queryRunner.manager.create(Organizacion, createOrganizacionDto);
      await queryRunner.manager.save(Organizacion, organizacion);
      await queryRunner.commitTransaction();
      return organizacion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear la organización: ${error.message}`);

      throw new BadRequestException(`Error al crear la organización: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateOrganizacionDto: UpdateOrganizacionDto): Promise<Organizacion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar la Organización existente
      const organizacion = await queryRunner.manager.findOne(Organizacion, { where: { id } });
      if (!organizacion) throw new NotFoundException(`Organización con ID "${id}" no encontrada`);

      Object.assign(organizacion, updateOrganizacionDto);
      await queryRunner.manager.save(Organizacion, organizacion);
      await queryRunner.commitTransaction();
      return organizacion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error al actualizar la organización: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const organizacion = await this.findOne(id);
    await this.organizacionesRepository.remove(organizacion);
  }
}
