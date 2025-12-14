import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OpenAiService } from '../openai/openai.service';
import { ChatIntentDto, ChatIntentType, ChatResponseDto } from './dto/chat-response.dto';

@Injectable()
export class ChatService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly openai: OpenAiService,
    ) {}

    private safeParseIntent(text: string): ChatIntentDto {
        try {
            const obj = JSON.parse(text);
            const intent = (obj?.intent ?? 'UNKNOWN') as ChatIntentType;
            const rawDate = obj?.date;
            const date =
                rawDate === null || rawDate === undefined || rawDate === 'null'
                    ? null
                    : typeof rawDate === 'string'
                    ? rawDate
                    : null;
            const allowed: ChatIntentType[] = [
            'NEW_USERS_TODAY',
            'TOTAL_USERS',
            'TOTAL_BOOKS',
            'NEW_USERS_THIS_WEEK',
            'BOOK_TITLE_VARIETY',
            'BOOKS_PER_AUTHOR',
            'TOP_BOOKS_BY_VIEWS',
            'UNKNOWN',
            ];

        return {
                intent: allowed.includes(intent) ? intent : 'UNKNOWN',
                date: typeof date === 'string' ? date : null,
        };
            } catch {
        return { intent: 'UNKNOWN', date: null };
        }
    }

    private async classifyQuestion(question: string): Promise<ChatIntentDto> {
            const systemPrompt = `
    Bạn là bộ phân loại intent cho chatbot quản trị thư viện đọc sách.
    Chỉ trả về JSON đúng format:
    { "intent": "...", "date": "YYYY-MM-DD | null" }

    Intent:
    - NEW_USERS_TODAY: hỏi hôm nay có bao nhiêu người dùng/thành viên đăng ký mới
    - TOTAL_USERS: hỏi tổng số người dùng/thành viên
    - TOTAL_BOOKS: hỏi tổng số sách hiện có (tổng bản ghi trong bảng book)
    - NEW_USERS_THIS_WEEK: hỏi số người dùng đăng ký trong 7 ngày gần đây / tuần này
    - BOOK_TITLE_VARIETY: hỏi có bao nhiêu loại/tựa sách khác nhau (distinct book.title)
    - BOOKS_PER_AUTHOR: hỏi thống kê số sách theo tác giả (theo book.author_id)
    - TOP_BOOKS_BY_VIEWS: hỏi sách nào được xem nhiều / top view (dựa page_views.book_id)
    - UNKNOWN: còn lại

    Chỉ trả JSON.
    `;

        const content = await this.openai.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
        ]);

        return this.safeParseIntent(content);
    }

    private async handleIntent(x: ChatIntentDto): Promise<string> {
        switch (x.intent) {
            case 'NEW_USERS_TODAY':
                return this.getNewUsersToday();
            case 'TOTAL_USERS':
                return this.getTotalUsers();
            case 'TOTAL_BOOKS':
                return this.getTotalBooks();
            case 'NEW_USERS_THIS_WEEK':
                return this.getNewUsersThisWeek();
            case 'BOOK_TITLE_VARIETY':
                return this.getBookTitleVariety();
            case 'BOOKS_PER_AUTHOR':
                return this.getBooksPerAuthor();
            case 'TOP_BOOKS_BY_VIEWS':
                return this.getTopBooksByViews();
            default:
                return 'Mình chưa hiểu câu hỏi này. Bạn thử hỏi lại ngắn gọn hơn nhé.';
        }
    }

    private async getNewUsersToday(): Promise<string> {
        const rows = await this.dataSource.query(
        `SELECT COUNT(*)::int AS count
        FROM "user"
        WHERE DATE(created_at) = CURRENT_DATE;`,
        );
        const count = Number(rows[0]?.count ?? 0);
        return `Hôm nay có ${count} thành viên đăng ký mới.`;
    }

    private async getTotalUsers(): Promise<string> {
        const rows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM "user";`);
        const count = Number(rows[0]?.count ?? 0);
        return `Hiện hệ thống có tổng cộng ${count} thành viên.`;
    }

    private async getTotalBooks(): Promise<string> {
        const rows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM book;`);
        const count = Number(rows[0]?.count ?? 0);
        return `Hiện hệ thống đang có ${count} sách (tính theo số bản ghi trong bảng book).`;
    }

    private async getNewUsersThisWeek(): Promise<string> {
        const rows = await this.dataSource.query(
        `SELECT COUNT(*)::int AS count
        FROM "user"
        WHERE created_at >= NOW() - INTERVAL '7 days';`,
        );
        const count = Number(rows[0]?.count ?? 0);
        return `Trong 7 ngày gần đây có ${count} thành viên đăng ký mới.`;
    }

    private async getBookTitleVariety(): Promise<string> {
        const rows = await this.dataSource.query(
        `SELECT COUNT(DISTINCT title)::int AS count
        FROM book;`,
        );
        const count = Number(rows[0]?.count ?? 0);
        return `Hiện có ${count} loại/tựa sách khác nhau (tính theo title).`;
    }

    private async getBooksPerAuthor(): Promise<string> {
        const rows = await this.dataSource.query(
        `SELECT author_id, COUNT(*)::int AS total
        FROM book
        GROUP BY author_id
        ORDER BY total DESC, author_id ASC
        LIMIT 15;`,
        );

        if (!rows?.length) return 'Chưa có dữ liệu sách để thống kê theo tác giả.';

        const list = rows
        .map((r: any) => `author_id ${r.author_id}: ${r.total} sách`)
        .join('; ');

        return `Top tác giả theo số lượng sách (tối đa 15): ${list}.`;
    }

    private async getTopBooksByViews(): Promise<string> {
        const rows = await this.dataSource.query(
        `SELECT b.id, b.title, COUNT(pv.*)::int AS views
        FROM page_views pv
        JOIN book b ON b.id = pv.book_id
        GROUP BY b.id, b.title
        ORDER BY views DESC
        LIMIT 10;`,
        );

        if (!rows?.length) return 'Chưa có dữ liệu lượt xem (page_views) để thống kê.';

        const list = rows
        .map((r: any) => `${r.title} (${r.views} lượt xem)`)
        .join(', ');

        return `Top 10 sách theo lượt xem: ${list}.`;
    }

    async ask(question: string): Promise<ChatResponseDto> {
        const intent = await this.classifyQuestion(question);
        const answer = await this.handleIntent(intent);
        return { question, intent, answer };
    }
}
