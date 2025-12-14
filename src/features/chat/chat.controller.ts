import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { ChatCompletionRequestDto } from './dto/chat-completion.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('completion')
  @ApiOperation({ summary: 'Get chat completion from OpenAI' })
  @ApiBody({ type: ChatCompletionRequestDto })
  async chatCompletion(
    @Body() { sessionId, content }: ChatCompletionRequestDto,
  ) {
    const result = await this.chatService.chatCompletion(sessionId, content);
    return { success: true, data: result  };
  }

  @Get('with-categories')
  @ApiOperation({ summary: 'Get list of books with their categories' })
  async getBooksWithCategories() {
    return this.chatService.getBooksWithCategories();
  }
}
