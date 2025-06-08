export function bienvenidaTemplate(nombre: string, linkRestablecer: string | null) {
    let text = `Hola ${nombre},
  
    Gracias por unirte a nuestra plataforma.`;
  
    if (linkRestablecer) {
      text += ` Para acceder, primero debes crear tu contraseña.
  
    Haz clic en el siguiente enlace para configurar tu contraseña:
  
    ${linkRestablecer}`;
    }
  
    text += `
  
    ¡Bienvenido a la comunidad!
  
    Atentamente,
    Equipo de Certificados`;
  
    return {
      subject: `Bienvenido a la plataforma de Certificados, ${nombre}!`,
      text,
    };
  }
  