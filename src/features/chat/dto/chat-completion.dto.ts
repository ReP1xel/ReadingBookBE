import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatCompletionRequestDto {
  @ApiProperty({
    description: 'Unique session ID for maintaining conversation history',
    example: 'session-12345',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'The message content to send to the assistant',
    example: 'Xin chào, bạn có khỏe không?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
