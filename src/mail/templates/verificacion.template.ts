export function verificacionCorreoTemplate(nombre: string, link: string) {
    return {
      subject: 'Verifica tu cuenta',
      text: `
  Hola ${nombre},
  
  Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:
  
  ${link}
  
  Si no solicitaste esta cuenta, puedes ignorar este mensaje.
  
  Saludos,
  El equipo de Certificados
      `,
    };
  }
  