import {
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
  Column,
  CreateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Usuario } from "../usuarios/usuario.entity";

@Entity("organizaciones")
export class Organizacion {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty({
    example: "a0f6c8d4-1f3d-4d2f-9a8b-6e8af3b654d9",
    description: "ID único de la organización",
  })
  id: string;

  @Column({ unique: true })
  @ApiProperty({
    example: "12345678901",
    description: "RUC de la organización",
  })
  ruc: string;

  @Column()
  @ApiProperty({
    example: "Global Tecnologías Academy",
    description: "Nombre de la organización",
  })
  razon_social: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "www.web.pe",
    description: "URL del sitio web de la organización",
  })
  url_web: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "Corporación", description: "Tipo de organización" })
  tipo: string;

  @Column({ type: "text", nullable: true })
  @ApiProperty({
    example: "Centro educativo...",
    description: "Descripción de la organización",
  })
  descripcion: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "Perú",
    description: "País donde opera la organización",
  })
  pais: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "/imagenes/organizaciones/logo.png",
    description: "Ruta de la imagen asociada",
  })
  url_imagen: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "contacto@web.pe",
    description: "Correo electrónico de contacto",
  })
  email_contacto: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "soporte@web.pe",
    description: "Correo electrónico de soporte",
  })
  email_soporte: string;

  @CreateDateColumn()
  @ApiProperty({
    example: "2024-12-13T12:00:00Z",
    description: "Fecha de creación",
  })
  creado_en: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.organizacion)
  usuarios: Usuario[];

  @ManyToMany(() => Usuario, user => user.organizaciones)
  usuariosVinculados: Usuario[];
}
