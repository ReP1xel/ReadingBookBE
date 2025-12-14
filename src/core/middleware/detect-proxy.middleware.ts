import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

@Injectable()
export class DetectProxyMiddleware implements NestMiddleware {
  private async isProxyIp(ip: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://proxycheck.io/v2/${ip}?key=YOUR_API_KEY&vpn=1`,
      );
      return response.data[ip]?.proxy === 'yes';
    } catch (error) {
      return false;
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!ip) {
      return res
        .status(400)
        .json({
          status: false,
          code: 'INVALID_IP',
          message: 'Cannot detect IP address',
        });
    }

    if (await this.isProxyIp(ip.toString())) {
      return res
        .status(403)
        .json({
          status: false,
          code: 'PROXY_DETECTED',
          message: 'Access denied: Proxy/VPN detected',
        });
    }
    next();
  }
}
