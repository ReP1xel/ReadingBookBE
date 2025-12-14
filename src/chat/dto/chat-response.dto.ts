export type ChatIntentType =
    | 'NEW_USERS_TODAY'
    | 'TOTAL_USERS'
    | 'TOTAL_BOOKS'
    | 'NEW_USERS_THIS_WEEK'
    | 'BOOK_TITLE_VARIETY'
    | 'BOOKS_PER_AUTHOR'
    | 'TOP_BOOKS_BY_VIEWS'
    | 'UNKNOWN';

export class ChatIntentDto {
    intent: ChatIntentType;
    date: string | null;
}

export class ChatResponseDto {
    question: string;
    intent: ChatIntentDto;
    answer: string;
}
