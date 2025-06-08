import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillaCertificado } from './plantillas_certificado.entity';
import { PlantillasCertificadosService } from './plantillas_certificados.service';
import { PlantillasCertificadosController } from './plantillas_certificados.controller';
import { Badge } from '../badges/badge.entity';
import { BadgesModule } from '../badges/badges.module'; 
import { LoggerModule } from '../logger/logger.module'; 
@Module({
  imports: [
    TypeOrmModule.forFeature([PlantillaCertificado]), 
    BadgesModule,
    LoggerModule
  ],
  controllers: [PlantillasCertificadosController],
  providers: [PlantillasCertificadosService],
})
export class PlantillasCertificadosModule {}