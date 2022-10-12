import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { config } from './common/config';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';
import { RequestsModule } from './requests/requests.module';
import { GiveReceive } from './telegram/wizards/give.receive';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => config.getDatabaseOptions(),
    }),
    TelegramModule,
    TelegrafModule.forRootAsync({
      useFactory: () => {
        return {
          token: config.telegramToken(),
          middlewares: [session()],
        };
      },
    }),
    UsersModule,
    RequestsModule,
  ],
  providers: [GiveReceive],
})
export class AppModule {}
