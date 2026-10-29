import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { AttemptsService } from './attempts.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@ApiTags('attempts')
@ApiBearerAuth()
@Roles(Role.USER)
@Controller()
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post('quizzes/:id/attempts')
  @ApiOperation({ summary: 'Stake the quiz entry cost and start an attempt' })
  start(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.attempts.start(user.id, id);
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Attempts for the signed-in player' })
  list(@CurrentUser() user: AuthUser) {
    return this.attempts.list(user.id);
  }

  @Get('attempts/:id')
  @ApiOperation({ summary: 'One attempt. Correct answers appear only after it is settled.' })
  get(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.attempts.get(user.id, id);
  }

  @Post('attempts/:id/submit')
  @ApiOperation({ summary: 'Score the attempt on the server and settle credits once' })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.attempts.submit(user.id, id, dto);
  }
}
