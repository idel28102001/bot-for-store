import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { config } from 'src/common/config';
import { UsersEntity } from 'src/users/entities/users.entities';
import { UsersService } from 'src/users/services/users.service';
import { Context } from 'telegraf';
import { FindOneOptions, Repository } from 'typeorm';
import { RequestsEntity } from '../entities/requests.entity';
import { messagesArrayInterface } from '../interfaces/messages-array.interface';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestsEntity)
    private readonly requestRepostitory: Repository<RequestsEntity>,
    private readonly usersService: UsersService,
  ) {}

  async createReq(data: any, tgId: number, ctx: Context) {
    const user = await this.usersService.getUserByTelegramId(tgId, ctx, {
      relations: ['requests'],
    });
    const req = this.requestRepostitory.create(
      data,
    ) as unknown as RequestsEntity;
    user.requests.push(req);
    const result = await this.usersService.save(user);
    const last = result.requests.slice(-1)[0];
    await this.requestRepostitory.save(last);
    return last;
  }

  async save(data: any): Promise<RequestsEntity> {
    return await this.requestRepostitory.save(data);
  }

  async findById(
    id: string,
    options?: FindOneOptions<RequestsEntity>,
  ): Promise<RequestsEntity> {
    return await this.requestRepostitory.findOne(id, options);
  }
}
