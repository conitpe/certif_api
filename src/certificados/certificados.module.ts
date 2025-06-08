// src/certificados/certificados.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificadosService } from './certificados.service';
import { CertificadosController } from './certificados.controller';
import { Certificado } from './certificado.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Badge } from '../badges/badge.entity';
import { PlantillaCertificado } from '../plantillas_certificados/plantillas_certificado.entity';

import { LoggerModule } from '../logger/logger.module';
import { Organizacion } from '../organizaciones/organizacion.entity';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module'; 

import { MailModule } from '../mail/mail.module'; 


@Module({
  imports: [
    TypeOrmModule.forFeature([Certificado, Usuario, Badge, PlantillaCertificado,Organizacion]),
    MailModule,
    LoggerModule
  ],
  controllers: [CertificadosController],
  providers: [CertificadosService],
})
export class CertificadosModule {}