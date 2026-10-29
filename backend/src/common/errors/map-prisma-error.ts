import { HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export type MappedApiError = {
  statusCode: number;
  code: string;
  message: string;
};

export function mapPrismaError(error: PrismaClientKnownRequestError): MappedApiError | null {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'That value is already in use',
      };
    case 'P2003':
      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'RELATED_RECORD_MISSING',
        message: 'A related record is missing or was removed',
      };
    case 'P2025':
    case 'P2023':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      };
    default:
      return null;
  }
}
