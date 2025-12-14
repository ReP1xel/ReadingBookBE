import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async ask(@Body() dto: ChatRequestDto) {
  // test nhanh xem dto.question có vào không
  console.log('QUESTION:', dto.question);
  return this.chatService.ask(dto.question);
  }

}
