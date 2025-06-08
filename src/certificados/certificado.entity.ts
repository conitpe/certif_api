// src/certificados/entities/certificado.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Usuario } from '../usuarios/usuario.entity';
  import { Badge } from '../badges/badge.entity';
  import { PlantillaCertificado } from '../plantillas_certificados/plantillas_certificado.entity';
  
  @Entity('certificados')
  export class Certificado {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => Usuario, (usuario) => usuario.certificados)
    @JoinColumn({ name: 'propietario_id' }) 
    propietario: Usuario;
  
    @ManyToOne(() => Badge, (badge) => badge.certificados)
    @JoinColumn({ name: 'badge_id' })
    badge: Badge;
  
    @ManyToOne(() => PlantillaCertificado, (plantilla) => plantilla.certificados, { nullable: true })
    @JoinColumn({ name: 'plantilla_certificado_id' }) 
    plantilla: PlantillaCertificado;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    ruta_insignia: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    ruta_certificado: string;
  
    @Column({ type: 'jsonb', nullable: true }) 
  metadata: Record<string, any>;
  
    @Column({ type: 'jsonb', nullable: true })
    recipient: object;
  
    @Column({
        type: 'enum',
        enum: ['pendiente', 'aceptado', 'rechazado'],
        default: 'pendiente',
      })
      estado: 'pendiente' | 'aceptado' | 'rechazado';
  
    @Column({ type: 'date', nullable: false })
    fecha_emision: Date;
  
    @Column({ type: 'date', nullable: true })
    fecha_expiracion: Date;
  
    @CreateDateColumn()
    issued_on: Date;
  
    @UpdateDateColumn()
    actualizado_en: Date;
  }