import { Entity, PrimaryGeneratedColumn, Column,OneToMany,ManyToMany,JoinTable,ManyToOne,JoinColumn} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Certificado } from '../certificados/certificado.entity';
import { Organizacion } from '../organizaciones/organizacion.entity'; 
import { IsString, IsOptional } from 'class-validator';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '1f3d4bc6-4d2f-11ec-81d3-0242ac130003', description: 'ID único del usuario' })
  id: string;

  @Column()
  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  nombre: string;

  @Column()
  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  apellido: string;

  @Column({ unique: true })
  @ApiProperty({ example: 'juan.perez@example.com', description: 'Correo electrónico del usuario' })
  email: string;

  @Column()
  @ApiProperty({ example: '123456789', description: 'Número de teléfono del usuario' })
  telefono: string;

  @Column()
  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  contrasena: string;

  @Column({ type: 'enum', enum: ['beneficiario', 'administrador', 'superadministrador'] })
  @ApiProperty({ example: 'beneficiario', description: 'Rol del usuario' })
  rol: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ example: '2024-12-12T10:00:00Z', description: 'Fecha de creación del usuario' })
  creado_en: Date;

  @Column({ nullable: true })
  @ApiProperty({ example: '12345678', description: 'DNI del usuario', required: false })
  dni?: string;

  @Column({ type: 'date', nullable: true })
  @ApiProperty({ example: '1990-01-01', description: 'Fecha de nacimiento del usuario', required: false })
  fecha_de_nacimiento?: Date;
  
  @Column({ nullable: false })
  @ApiProperty({ example: 'https://facebook.com/juan.perez', description: 'URL del perfil de Facebook del usuario', required: false })
  facebook_url?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'https://linkedin.com/in/juan-perez', description: 'URL del perfil de LinkedIn del usuario', required: false })
  linkedin_url?: string;

  @Column({ nullable: true, length: 64 })
  resetPasswordToken: string;

  @OneToMany(() => Certificado, (certificado) => certificado.propietario)
  certificados: Certificado[];


  @ManyToOne(() => Organizacion, { nullable: true }) 
  @JoinColumn({ name: 'organizacion_id' }) 
  @ApiProperty({ example: '5e8c1a2d-6f3b-4c2a-b2b6-3a9d2e6a6b5c', description: 'ID de la organización a la que pertenece el usuario', required: false })
  organizacion?: Organizacion;


  @ManyToMany(() => Organizacion, org => org.usuariosVinculados)
  @JoinTable({
    name: 'usuario_organizacion',
    joinColumn:    { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'organizacion_id', referencedColumnName: 'id' }
  })
  organizaciones: Organizacion[];


  @Column({ default: false })
verificado: boolean;

@Column({ type: 'varchar', length: 255, nullable: true })
token_verificacion: string;

}
