import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAiModule } from '../openai/openai.module';

@Module({
  imports: [OpenAiModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
