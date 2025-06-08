/*import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  
  @Controller('upload')
  export class UploadController {
    @Post()
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads', // Directorio donde se guardan las imágenes
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
      }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
      return { url: `http://localhost:3000/uploads/${file.filename}` };
    }
  }*/
  
    import {
      Controller,
      Post,
      UploadedFile,
      UseInterceptors,
    } from '@nestjs/common';
    import { FileInterceptor } from '@nestjs/platform-express';
    import { diskStorage } from 'multer';
    import { extname } from 'path';
    
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    
    @Controller('upload')
    export class UploadController {
      @Post()
      @UseInterceptors(
        FileInterceptor('file', {
          storage: diskStorage({
            destination: './uploads', // Directorio donde se guardan las imágenes
            filename: (req, file, callback) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
        }),
      )
      uploadFile(@UploadedFile() file: Express.Multer.File) {
        return { url: `${BASE_URL}/uploads/${file.filename}` };
      }
    }
    