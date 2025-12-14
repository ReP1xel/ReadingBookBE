import { IsString, IsNotEmpty } from 'class-validator';

export class ChatRequestDto {
    @IsString()
    @IsNotEmpty()
    question: string;
}
