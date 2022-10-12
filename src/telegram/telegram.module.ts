import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { TelegramUpdate } from './update/telegram.update';
import { TelegramMainService } from './services/telegram-main.service';
import { TelegramClientService } from './services/telegram-client.service';
import { RequestsModule } from 'src/requests/requests.module';

@Module({
  imports: [UsersModule, RequestsModule],
  providers: [TelegramUpdate, TelegramMainService, TelegramClientService],
})
export class TelegramModule {}
