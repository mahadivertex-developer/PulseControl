import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getRoot() {
    return {
      service: 'PulseControlERP Backend API',
      status: 'ok',
      docs: '/api/docs',
      authLogin: '/api/auth/login',
    };
  }
}