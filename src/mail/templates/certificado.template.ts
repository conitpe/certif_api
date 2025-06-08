export function certificadoTemplate(nombre: string, linkCertificado: string) {
    return {
      subject: `Tu certificado está listo, ${nombre}!`,
      text: `Hola ${nombre},
  
      Has recibido un nuevo certificado. Puedes verlo en el siguiente enlace:
  
      ${linkCertificado}
  
      Atentamente,
      Equipo de Certificados`,
    };
  }
  