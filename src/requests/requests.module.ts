import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { RequestsEntity } from './entities/requests.entity';
import { RequestsService } from './service/requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestsEntity]), UsersModule],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
