import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriosService } from './criterios.service';
import { CriteriosController } from './criterios.controller';
import { Criterio } from './criterio.entity';
import { LoggerModule } from '../logger/logger.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Criterio]),
    LoggerModule, 
  ],
  controllers: [CriteriosController],
  providers: [CriteriosService],
})
export class CriteriosModule {}
