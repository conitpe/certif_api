import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,DataSource } from 'typeorm';
import { Habilidad } from './habilidades.entity';
import { AppLoggerService } from 'src/logger/logger.service';

@Injectable()
export class HabilidadesService {
  constructor(
    @InjectRepository(Habilidad)
    private readonly habilidadesRepository: Repository<Habilidad>,
    private readonly dataSource: DataSource,    
    private readonly logger: AppLoggerService 
  ) {}

  // Obtener todas las habilidades
  async findAll(): Promise<Habilidad[]> {
    return this.habilidadesRepository.find();
  }

  // Buscar una habilidad por nombre
  async findByName(nombre: string): Promise<Habilidad | null> {
    return this.habilidadesRepository.findOne({ where: { nombre } });
  }

// Crear una nueva habilidad con validación de duplicados y transacción
async create(nombre: string): Promise<Habilidad> {
  if (!nombre || nombre.trim() === '') {
    this.logger.warn(`Intento de crear habilidad sin nombre válido.`);
    throw new BadRequestException('El nombre de la habilidad es obligatorio.');
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const habilidadExistente = await queryRunner.manager.findOne(Habilidad, { where: { nombre: nombre.trim() } });

    if (habilidadExistente) {
      await queryRunner.rollbackTransaction();
      this.logger.warn(`La habilidad "${nombre}" ya existe. No se creará una nueva.`);
      return habilidadExistente;
    }

    const nuevaHabilidad = queryRunner.manager.create(Habilidad, { nombre: nombre.trim() });
    await queryRunner.manager.save(Habilidad, nuevaHabilidad);

    await queryRunner.commitTransaction();
    return nuevaHabilidad;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    this.logger.error(`Error al crear habilidad: ${error.message}`);
    throw new BadRequestException(`Error al crear la habilidad: ${error.message}`);
  } finally {
    await queryRunner.release();
  }
}
}
