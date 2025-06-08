import { Controller, Post, Body,Get,Query} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user); 
  }
  @Post('reset-password')
  async resetPassword(@Body('token') token: string, @Body('password') password: string) {
    return await this.authService.resetPassword(token, password);
  }

  @Post('solicitar-recuperacion')
  async solicitarRecuperacion(@Body('email') email: string) {
    return await this.authService.solicitarRecuperacion(email);
  }

  @Get('verificar')
async verificarCuenta(@Query('token') token: string) {
  return this.authService.verificarCuentaPorToken(token);
}

@Post('reenviar-verificacion')
async reenviarVerificacion(@Body('email') email: string) {
  return this.authService.reenviarCorreoVerificacion(email);
}


}
