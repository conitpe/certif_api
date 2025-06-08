import { Module,forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizacionesService } from './organizaciones.service';
import { OrganizacionesController } from './organizaciones.controller';
import { Organizacion } from './organizacion.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { LoggerModule } from '../logger/logger.module'; 
@Module({
  imports: [
    TypeOrmModule.forFeature([Organizacion]),
    LoggerModule, 
    forwardRef(() => UsuariosModule),
  ],
  providers: [OrganizacionesService],
  controllers: [OrganizacionesController],
  exports: [TypeOrmModule], 
})
export class OrganizacionesModule {}
