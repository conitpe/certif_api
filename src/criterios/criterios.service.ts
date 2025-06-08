import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,DataSource} from 'typeorm';
import { Criterio } from './criterio.entity';
import { AppLoggerService } from 'src/logger/logger.service';

@Injectable()
export class CriteriosService {
  constructor(
    @InjectRepository(Criterio)
    private readonly criteriosRepository: Repository<Criterio>,
     private readonly dataSource: DataSource,     
    private readonly logger: AppLoggerService 
  ) {}

  async findAll(): Promise<Criterio[]> {
    return this.criteriosRepository.find({ relations: ['badge'] });
  }

  async findOne(id: string): Promise<Criterio> {
    const criterio = await this.criteriosRepository.findOne({ where: { id }, relations: ['badge'] });
    if (!criterio) {
      this.logger.warn(`Criterio con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Criterio con ID "${id}" no encontrado`);
    }
    return criterio;
  }

  async create(createCriterioDto: { badge_id: string; description: string }): Promise<Criterio> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el Criterio
      this.logger.log(`Creando criterio para badge ID: ${createCriterioDto.badge_id}`);
      const criterio = queryRunner.manager.create(Criterio, createCriterioDto);
      await queryRunner.manager.save(Criterio, criterio);
      await queryRunner.commitTransaction();
      return criterio;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear criterio: ${error.message}`);
      throw new Error("Error al crear el criterio: " + error.message);

    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateCriterioDto: { description?: string }): Promise<Criterio> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar el Criterio existente
      this.logger.log(`Actualizando criterio con ID: ${id}`);
      const criterio = await queryRunner.manager.findOne(Criterio, { where: { id } });
      if (!criterio) {
        this.logger.warn(`⚠️ Criterio con ID "${id}" no encontrado.`);
        throw new NotFoundException(`Criterio con ID "${id}" no encontrado`);
      }

      //Actualizar el Criterio
      Object.assign(criterio, updateCriterioDto);
      await queryRunner.manager.save(Criterio, criterio);

      await queryRunner.commitTransaction();
      return criterio;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al actualizar criterio con ID ${id}: ${error.message}`); 
      throw new Error("Error al actualizar el criterio: " + error.message);
    } finally {
      await queryRunner.release();
    }
  }


  async delete(id: string): Promise<void> {
    const criterio = await this.findOne(id);
    await this.criteriosRepository.remove(criterio);
    this.logger.log(`Criterio con ID ${id} eliminado correctamente.`);
  }
}
