import { Test, TestingModule } from '@nestjs/testing';
import { OrganizacionesService } from './organizaciones.service';

describe('OrganizacionesService', () => {
  let service: OrganizacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizacionesService],
    }).compile();

    service = module.get<OrganizacionesService>(OrganizacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
