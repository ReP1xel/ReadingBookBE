import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CacheService } from './cache.service';

@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  // @Post('set')
  // async setCache(@Body() body: { key: string; value: string; ttl?: number }) {
  //   await this.cacheService.set(body.key, body.value, body.ttl);
  //   return { status: true, message: `Key ${body.key} set successfully` };
  // }

  // @Get('get/:key')
  // async getCache(@Param('key') key: string) {
  //   const value = await this.cacheService.get(key);
  //   return { status: true, data: value };
  // }

  // @Delete('delete/:key')
  // async deleteCache(@Param('key') key: string) {
  //   await this.cacheService.delete(key);
  //   return { status: true, message: `Key ${key} deleted successfully` };
  // }

  // @Post('publish')
  // async publish(@Body() body: { channel: string; message: string }) {
  //   await this.cacheService.publish(body.channel, body.message);
  //   return { status: true, message: `Message sent to channel ${body.channel}` };
  // }

  // @Post('stream/add')
  // async addToStream(@Body() body: { event: string; data: any }) {
  //   await this.cacheService.addToStream(body.event, body.data);
  //   return { status: true, message: `Event ${body.event} added to stream` };
  // }

  // @Get('stream/read')
  // async readStream() {
  //   const events = await this.cacheService.readStream();
  //   return { status: true, data: events };
  // }

  // @Post('hash/set')
  // async setHash(@Body() body: { key: string; field: string; value: string }) {
  //   await this.cacheService.setHash(body.key, body.field, body.value);
  //   return {
  //     status: true,
  //     message: `Hash field ${body.field} set successfully`,
  //   };
  // }

  // @Get('hash/get/:key/:field')
  // async getHash(@Param('key') key: string, @Param('field') field: string) {
  //   const value = await this.cacheService.getHash(key, field);
  //   return { status: true, data: value };
  // }
}
