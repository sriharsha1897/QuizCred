import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CreditsService } from './credits.service';
import { PurchaseDto } from './dto/purchase.dto';

@ApiTags('credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get('balance')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Current credit balance' })
  balance(@CurrentUser() user: AuthUser) {
    return this.credits.getBalance(user.id);
  }

  @Get('transactions')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Recent ledger entries, newest first' })
  transactions(@CurrentUser() user: AuthUser) {
    return this.credits.listTransactions(user.id);
  }

  @Get('packs')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Credit packs available for purchase' })
  packs() {
    return this.credits.listPacks();
  }

  @Post('purchase')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Buy a credit pack. Replaying the idempotency key does not credit twice.' })
  purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseDto) {
    return this.credits.purchase(user.id, dto.packId, dto.idempotencyKey);
  }
}
