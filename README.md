
#  Aplicación de Certificados Digitales con OpenBadge

##  Descripción del Proyecto

Este proyecto es una API desarrollada con **NestJS**, **TypeORM** y **PostgreSQL**, orientada a la generación, emisión y validación de **certificados digitales educativos** compatibles con el estándar internacional **OpenBadge**. Permite emitir certificados en PDF personalizados, firmados digitalmente, con códigos QR, y genera metadatos en formato JSON-LD según las especificaciones de la [Open Badges Specification v2.0](https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html).

---

## Funcionalidades Clave

- Emisión de certificados PDF dinámicos desde plantillas gráficas.
-  Gestión completa de insignias (**badges**), criterios, habilidades y organizaciones emisoras.
-  Relación de certificados con usuarios beneficiarios.
-  Generación de metadatos JSON-LD conforme a OpenBadge.
-  Envío automático de certificados y mensajes de bienvenida por correo.
-  Autenticación JWT (login, recuperación de contraseña, roles).
-  Endpoint de validación pública y privada del certificado.
-  Logger profesional con Winston y rotación diaria.
-  Swagger UI para documentación interactiva del API.

---

##  Estructura del Proyecto

\`\`\`bash
src/
├── auth/                    # Módulo de autenticación JWT
├── badges/                 # Gestión de insignias (OpenBadge)
├── certificados/           # Emisión de certificados y PDF
├── criterios/              # Criterios de evaluación
├── habilidades/            # Habilidades asociadas al badge
├── mail/                   # Plantillas y servicio de email
├── organizaciones/         # Organizaciones emisoras
├── plantillas_certificados/# Plantillas visuales de certificados
├── usuarios/               # Usuarios beneficiarios y administradores
├── upload/                 # Carga de archivos (imágenes/fondos)
├── logger/                 # Logger personalizado
\`\`\`

---

##  Dependencias Principales

El proyecto se basa en:

- \`@nestjs/core\`, \`@nestjs/typeorm\`, \`@nestjs/jwt\`
- \`typeorm\`, \`pg\`
- \`pdf-lib\`, \`qrcode\`, \`node-html-parser\`
- \`nodemailer\`, \`bcrypt\`, \`class-validator\`
- \`winston\`, \`nest-winston\`

Consulta el \`package.json\` para más detalles.

---

## Cumplimiento con OpenBadge

La función \`generateJsonLd(id: string)\` dentro del servicio \`CertificadosService\` construye una estructura JSON-LD conforme a la especificación **OpenBadge v2.0**, incluyendo:

- Contexto y tipo: \`Assertion\`
- Información del \`recipient\` (email)
- Información del \`badge\` asociado
- Enlace a metadatos de criterio y habilidades
- Información de \`issuer\` (organización emisora)
- Fecha de emisión, URL pública y verificación tipo \`HostedBadge\`

Esto permite que cualquier plataforma compatible con OpenBadge pueda interpretar, verificar y mostrar el badge emitido.

---

##  Scripts Disponibles

\`\`\`bash
# Servidor local con hot reload
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar pruebas
npm run test
npm run test:watch

# Formatear código
npm run format

# Lint con correcciones automáticas
npm run lint
\`\`\`

---

## ⚙️ Variables de Entorno \`.env\`

Asegúrate de definir estas variables en tu archivo `.env`:

\`\`\`env
DATABASE_URL=postgres://user:pass@localhost:5432/certificados
JWT_SECRET=...
FRONTEND_URL=https://certif.digital
EMAIL_USER=...
EMAIL_PASS=...
\`\`\`

---

##  Requisitos para Desarrollo

- Node.js v18+
- PostgreSQL v13+
- Nest CLI (\`npm i -g @nestjs/cli\`)
- Editor recomendado: VSCode + Extensiones ESLint y Prettier

---

##  API Docs

Una vez ejecutado el servidor, accede a la documentación Swagger:

\`\`\`
http://localhost:3000/api
\`\`\`

Incluye todos los endpoints de autenticación, emisión, consulta de certificados y más.

---

##  Autores y Licencia

> Proyecto desarrollado por el equipo de **CertifPro Digital**.  
> Licencia **UNLICENSED** para uso privado o institucional.  
> Contacto: contacto@certif.digital

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).