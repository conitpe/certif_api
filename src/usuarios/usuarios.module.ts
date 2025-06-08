import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { LoggerModule } from '../logger/logger.module'; 
import { MailModule } from '../mail/mail.module'; 
import { ConfigModule } from '@nestjs/config'; 

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]),
  OrganizacionesModule,
  LoggerModule, 
  MailModule,
  ConfigModule
],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService],
})
export class UsuariosModule {}
