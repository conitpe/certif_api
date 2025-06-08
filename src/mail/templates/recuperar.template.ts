export function recuperarPasswordTemplate(nombre: string, linkRestablecer: string) {
    return {
      subject: `Recuperación de Contraseña, ${nombre}!`,
      text: `Hola ${nombre},
  
      Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:
  
      ${linkRestablecer}
  
      Si no realizaste esta solicitud, ignora este mensaje.
  
      Atentamente,
      Equipo de Certificados`,
    };
  }
  