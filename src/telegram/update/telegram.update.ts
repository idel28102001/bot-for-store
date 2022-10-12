import { Action, Hears, On, Start, Update } from 'nestjs-telegraf';
import { UsersService } from 'src/users/services/users.service';
import { Context } from 'telegraf';
import { TelegramClientService } from '../services/telegram-client.service';
import { TelegramMainService } from '../services/telegram-main.service';

@Update()
export class TelegramUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly telegramMainService: TelegramMainService,
    private readonly telegramClientService: TelegramClientService,
  ) {}

  @Start()
  async startCommand(ctx: any) {
    const { id, first_name, last_name, username } = ctx.update.message.from;
    await this.usersService.register({
      telegramId: id,
      firstName: first_name,
      lastName: last_name,
      username,
    });
    await ctx.reply('Начало положено');
  }

  // @On('sticker')
  // async onSticker(ctx: Context) {
  //   // await ctx.replyWithSticker(
  //   //   'CAACAgIAAxkBAAICK2KPE0pO6VGixX1byE3386a_BpROAALCBQACqqh0CnNnCQIvbfl9JAQ',
  //   // );
  //   const elems = [
  //     'CAACAgEAAxkBAAICMGKPE6YZP-1h5OlXkmda7V3b_vtGAALCAQACZVGgRnRpbooF-QONJAQ',
  //     'CAACAgEAAxkBAAICMmKPE7eLge-rHmlEsMYn7m-GhNyCAAJYAQACoTOoRqA6PMTVO6HMJAQ',
  //     'CAACAgEAAxkBAAICNGKPE8c-_WOyTX2aDgzRiUp0ppNYAALRAQACEAapRha9PqS3VI9yJAQ',
  //   ];
  //   for (const curr of elems) {
  //     await ctx.replyWithSticker(curr);
  //   }
  // }

  @Hears(/^\/menu$/i)
  @Action(/\/menu/)
  async hear(ctx: any) {
    await ctx.deleteMessage();
    const { id } = ctx.update.message
      ? ctx.update.message.from
      : ctx.update.callback_query.message.chat;
    await this.telegramMainService.sendKeyboard(ctx, id);
  }

  @Action(/^watch-\((.+)\)$/)
  async watch(ctx: any) {
    const res = ctx.match[1];
    await ctx.reply(`${res} - Ссылка будет после доработки сервера`);
  }

  @Action(/^client-\(([a-zA-Z\-]+?)\)$/)
  async client(ctx: Context) {
    await this.telegramClientService.clientReply(ctx);
  }

  @Action(/^exchange-\(([a-zA-Z]+?)\)(-\(([a-zA-Z]+?)\))?$/)
  async exchange(ctx: Context) {
    await this.telegramClientService.exchangeScenario(ctx);
  }

  @Action(/^foreign(-\(([a-zA-Z]+?)\))?$/)
  async foreign(ctx: Context) {
    await this.telegramClientService.foreign(ctx);
  }

  @Action(/^fExchange-\(([a-zA-Z]+?)\)$/)
  async fExchange(ctx: Context) {
    await this.telegramClientService.fExchange(ctx);
  }

  @Action(/^request-\(([a-zA-Z]+?)\)$/)
  async request(ctx: Context) {
    await this.telegramClientService.sendRequest(ctx);
  }
}
