import { Injectable,NotFoundException,BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Organizacion } from 'src/organizaciones/organizacion.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { recuperarPasswordTemplate } from '../mail/templates/recuperar.template'; 
import { MailService } from '../mail/mail.service'; 
import { randomBytes } from 'crypto';
import { verificacionCorreoTemplate } from '../mail/templates/verificacion.template';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private usuariosService: UsuariosService,
    private readonly mailService: MailService, 
    private readonly configService: ConfigService, 
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usuariosService.findByEmail(email);
    console.log('Usuario encontrado:', user);

    if (!user) {
        throw new UnauthorizedException('Usuario no encontrado.');
    }

    if (!user.contrasena) {
        throw new UnauthorizedException('Este usuario no tiene contraseña registrada.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.contrasena);
    if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const { contrasena, ...result } = user;
    return result;
}

async login(user: any) {
  const fullUser = await this.usuariosService.findOne(user.id); 
  if (!fullUser.verificado) {
    throw new UnauthorizedException('Cuenta no verificada');
  }

  const payload = { 
      username: fullUser.email, 
      sub: fullUser.id, 
      role: fullUser.rol, 
      organizacionId: fullUser.organizacion ? fullUser.organizacion.id : null 
  };

  return {
    access_token: this.jwtService.sign(payload),
    user_id: fullUser.id,  
    user_role: fullUser.rol,
    organizacion_id: fullUser.organizacion ? fullUser.organizacion.id : null 
  };
}




  async resetPassword(token: string, newPassword: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { resetPasswordToken: token } });

    if (!usuario) {
      throw new NotFoundException('Token inválido o expirado.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');
    }

    usuario.contrasena = await bcrypt.hash(newPassword, 10);
    usuario.resetPasswordToken = null; 
    await this.usuarioRepository.save(usuario);

    return { message: 'Contraseña actualizada exitosamente' };
  }
  async solicitarRecuperacion(email: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { email } });

    if (!usuario) {
      throw new NotFoundException('No se encontró un usuario con ese correo.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    usuario.resetPasswordToken = resetToken;
    await this.usuarioRepository.save(usuario);


    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const linkRestablecer = `${frontendUrl}/recuperar/${resetToken}`;

  
    const emailTemplate = recuperarPasswordTemplate(usuario.nombre, linkRestablecer);
    await this.mailService.sendMail(usuario.email, emailTemplate.subject, emailTemplate.text);

    return { message: 'Se ha enviado un enlace de recuperación a tu correo.' };
  }

  async verificarCuentaPorToken(token: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { token_verificacion: token },
    });
  
    if (!usuario) {
      throw new NotFoundException('Token inválido o expirado.');
    }
  
    if (usuario.verificado) {
      return { mensaje: 'La cuenta ya fue verificada anteriormente.' };
    }
  
    usuario.verificado = true;
    usuario.token_verificacion = null;
  
    await this.usuarioRepository.save(usuario);
  
    return { mensaje: '¡Correo verificado correctamente!' };
  }
  
  async reenviarCorreoVerificacion(email: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { email } });
  
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }
  
    if (usuario.verificado) {
      throw new BadRequestException('Este usuario ya está verificado.');
    }
  
    const nuevoToken = randomBytes(32).toString('hex');
    usuario.token_verificacion = nuevoToken;
    await this.usuarioRepository.save(usuario);
  
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const url = `${frontendUrl}/verificar?token=${nuevoToken}`;
    const plantilla = verificacionCorreoTemplate(usuario.nombre, url);
  
    await this.mailService.sendMail(usuario.email, plantilla.subject, plantilla.text);
    return { message: 'Correo reenviado correctamente' };
  }
  
  
}
