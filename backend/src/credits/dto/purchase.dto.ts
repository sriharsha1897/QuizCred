import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CREDIT_PACKS } from '../constants';

const PACK_IDS = CREDIT_PACKS.map((pack) => pack.id);

export class PurchaseDto {
  @ApiProperty({ example: 'pack_500', enum: PACK_IDS })
  @IsIn(PACK_IDS, { message: 'Choose one of the listed credit packs' })
  packId!: string;

  @ApiProperty({ example: 'order-2026-10-27-001', minLength: 8, maxLength: 80 })
  @IsString({ message: 'Idempotency key must be text' })
  @MinLength(8, { message: 'Idempotency key must be at least 8 characters' })
  @MaxLength(80, { message: 'Idempotency key must be at most 80 characters' })
  @Matches(/^[A-Za-z0-9._:-]+$/, {
    message: 'Idempotency key may only use letters, numbers, and . _ : -',
  })
  idempotencyKey!: string;
}
