import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { ManagementService } from './management.service';

@Controller('management')
@UseGuards(JwtAuthGuard)
export class ManagementController {
  constructor(private readonly service:ManagementService){}
  @Get('dashboard') dashboard(@Req() req:any){ return this.service.dashboard(req.user); }
  @Get('roles') roles(@Req() req:any){ return this.service.roles(req.user); }
  @Get('products/:id/full') productDetail(@Param('id',ParseIntPipe) id:number,@Req() req:any){ return this.service.productDetail(id,req.user); }
  @Patch('roles/:id/permissions') updateRolePermissions(@Param('id',ParseIntPipe) id:number,@Body() body:{permissions:string[]},@Req() req:any){ return this.service.updateRolePermissions(id,body.permissions,req.user); }
  @Patch('staff/:id/status') setStaffStatus(@Param('id',ParseIntPipe) id:number,@Body() body:{status:'ACTIVE'|'LOCKED'},@Req() req:any){ return this.service.setStaffStatus(id,body.status,req.user); }
  @Post('staff/:id/reset-password') resetStaffPassword(@Param('id',ParseIntPipe) id:number,@Body() body:{password:string},@Req() req:any){ return this.service.resetStaffPassword(id,body.password,req.user); }
  @Get(':resource') list(@Param('resource') resource:string,@Req() req:any,@Query('page') page?:number,@Query('limit') limit?:number,@Query('search') search?:string){ return this.service.list(resource,req.user,page,limit,search); }
  @Get(':resource/:id') one(@Param('resource') resource:string,@Param('id',ParseIntPipe) id:number,@Req() req:any){ return this.service.one(resource,id,req.user); }
  @Post(':resource') create(@Param('resource') resource:string,@Body() body:any,@Req() req:any){ return this.service.create(resource,body,req.user); }
  @Patch(':resource/:id') update(@Param('resource') resource:string,@Param('id',ParseIntPipe) id:number,@Body() body:any,@Req() req:any){ return this.service.update(resource,id,body,req.user); }
  @Delete(':resource/:id') remove(@Param('resource') resource:string,@Param('id',ParseIntPipe) id:number,@Req() req:any){ return this.service.remove(resource,id,req.user); }
}
