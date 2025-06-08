import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    try {

      const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Certif Digital');
      const fromEmail = this.configService.get<string>('SMTP_FROM', 'noreply@certif.digital');


      const mailOptions: any = {
       from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Correo enviado a ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('No se pudo enviar el correo');
    }
  }



  
}
