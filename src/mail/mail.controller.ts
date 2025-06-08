import { Controller, Get,Post, Query,Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  @Get('send')
  async sendTestMail(
    @Query('to') to: string,
    @Query('subject') subject: string,
    @Query('text') text: string
  ) {
    return await this.mailService.sendMail(to, subject, text);
  }

  @Post('contacto')
  async enviarCorreoContacto(@Body() body: { nombre: string; email: string; mensaje: string }) {
    const { nombre, email, mensaje } = body;

    const asunto = `📩 Nueva consulta de ${nombre}`;
    const contenido = `Han recibido un nuevo mensaje desde el formulario de contacto:\n\n` +
                      ` Nombre: ${nombre}\n Email: ${email}\n Mensaje:\n${mensaje}\n\n` +
                      `Saludos,\n`;
    
    const destinatario = this.configService.get<string>('SMTP_FROM_CONTACTO');

    try {
      await this.mailService.sendMail(destinatario, asunto, contenido); 
      return { success: true, message: 'Correo enviado correctamente' };
    } catch (error) {
      return { success: false, message: 'Error al enviar el correo' };
    }
  }

}
