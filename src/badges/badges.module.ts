import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { Badge } from './badge.entity';
import { Criterio } from '../criterios/criterio.entity';
import { CriterioBadge } from '../criterios/criterio-badge.entity';
import { Habilidad } from '../habilidades/habilidades.entity';
import { HabilidadBadge } from '../habilidades/habilidad-badge.entity';
import { UsuariosModule } from '../usuarios/usuarios.module'; 
import { LoggerModule } from '../logger/logger.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Badge, Criterio, CriterioBadge, Habilidad, HabilidadBadge]),
    UsuariosModule, 
    LoggerModule, 
  ],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [TypeOrmModule, BadgesService], // ✅ Se exporta para otros módulos
})
export class BadgesModule {}