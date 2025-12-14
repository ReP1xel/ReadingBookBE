import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ping(): object {
    return {
      code: 200,
      status: 'OK',
    };
  }
}
