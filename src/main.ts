import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path'; 
import { NestExpressApplication } from '@nestjs/platform-express'; 
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });


  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    credentials: true, 
  });

  
  const config = new DocumentBuilder()
    .setTitle('API de Certificados')
    .setDescription('Documentación de la API para gestionar usuarios, certificados y organizaciones.Implementación OpenBadge')
    .setVersion('1.0')
    .addTag('usuarios') 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0'); 

  console.log(`Servidor corriendo en: http://localhost:${PORT}`);

  
}

bootstrap();

