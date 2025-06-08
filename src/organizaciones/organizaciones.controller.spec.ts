import { Test, TestingModule } from '@nestjs/testing';
import { OrganizacionesController } from './organizaciones.controller';

describe('OrganizacionesController', () => {
  let controller: OrganizacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizacionesController],
    }).compile();

    controller = module.get<OrganizacionesController>(OrganizacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
