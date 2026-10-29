import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Published quizzes' })
  list() {
    return this.quizzes.listPublished();
  }

  @Get('manage')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Every quiz, including drafts' })
  manage() {
    return this.quizzes.listManaged();
  }

  @Get(':id/manage')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Quiz with correct answers, for the admin editor' })
  manageOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizzes.getManaged(id);
  }

  @Get(':id')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'One published quiz. Correct answers are omitted.' })
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizzes.getPublished(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a draft quiz' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuizDto) {
    return this.quizzes.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Edit quiz copy, stake, reward, or pass mark' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateQuizDto) {
    return this.quizzes.update(id, dto);
  }

  @Post(':id/publish')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Publish a quiz that has at least one question' })
  publish(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizzes.publish(id);
  }

  @Post(':id/unpublish')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Hide a quiz from players' })
  unpublish(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizzes.unpublish(id);
  }
}
