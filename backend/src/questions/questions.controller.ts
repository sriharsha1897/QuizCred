import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@ApiTags('questions')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller()
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Post('quizzes/:quizId/questions')
  @ApiOperation({ summary: 'Add a question to a quiz' })
  create(
    @Param('quizId', new ParseUUIDPipe()) quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questions.create(quizId, dto);
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Edit a question' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateQuestionDto) {
    return this.questions.update(id, dto);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete a question that no attempt has used' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.questions.remove(id);
  }
}
