import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { BadgesModule } from './badges/badges.module';
import { OrganizacionesModule } from './organizaciones/organizaciones.module';
import { UploadController } from './upload/upload.controller';
import { CriteriosModule } from './criterios/criterios.module';
import { HabilidadesModule } from './habilidades/habilidades.module';
import { PlantillasCertificadosModule } from './plantillas_certificados/plantillas_certificados.module';
import { CertificadosModule } from './certificados/certificados.module';
import { LoggerModule } from './logger/logger.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsuariosModule,
    AuthModule,
    BadgesModule,
    OrganizacionesModule,
    CriteriosModule,
    HabilidadesModule,
    PlantillasCertificadosModule,
    CertificadosModule,
    MailModule,
    LoggerModule,
  ],
  controllers: [UploadController],
})
export class AppModule { }
