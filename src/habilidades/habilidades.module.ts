import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habilidad } from './habilidades.entity';
import { HabilidadesService } from './habilidades.service';
import { HabilidadesController } from './habilidades.controller';
import { LoggerModule } from '../logger/logger.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Habilidad]),
    LoggerModule
  ],
  providers: [HabilidadesService],
  controllers: [HabilidadesController],
})
export class HabilidadesModule { }
