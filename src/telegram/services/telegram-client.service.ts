import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { Context as Ctx } from 'vm';
import { format } from 'date-fns';
import { COUNTRIES, CRYPT, FIATS } from '../../common/constants';
import { getCurrency } from '../../common/validate';
import { RequestsService } from '../../requests/service/requests.service';
import { Column } from 'typeorm';

@Injectable()
export class TelegramClientService {
  constructor(private readonly requestService: RequestsService) {}

  async clientReply(ctx: Context) {
    const action = (ctx as unknown as Ctx).match[1];
    await ctx.deleteMessage();
    switch (action) {
      case 'buy': {
        await this.buy(ctx);
        break;
      }
    }
  }

  async sendRequest(ctx: Context) {
    const cntx = ctx as any;
    const respond = cntx.match[1];
    const session = cntx.session;
    try {
      await ctx.deleteMessage();
      await ctx.deleteMessage();
    } catch (e) {}
    switch (respond) {
      case 'yes':
        await this.sendToChannel(ctx, session);
        break;
      case 'no':
        await ctx.replyWithSticker(
          'CAACAgIAAxkBAAICK2KPE0pO6VGixX1byE3386a_BpROAALCBQACqqh0CnNnCQIvbfl9JAQ',
        );
        break;
    }
  }

  async sendToChannel(ctx: Context, session) {
    const data = {
      from: session.from,
      to: session.to,
      type: session.type,
      currency1: session.toSend.currency,
      amount1: session.toSend.amount,
      currency2: session.toGet.currency,
      amount2: session.toGet.amount,
    };
    const result = await this.requestService.createReq(
      data,
      session.telegramId,
      ctx,
    );
    let first = `Заявка номер #${result.id}`;
    const time = format(new Date(), 'HH:mm dd.MM');
    const sendRes = [
      `Отправляет: ${session.toSend.amount} ${session.toSend.currency}`,
      `Получает: ${session.toGet.amount} ${session.toGet.currency}`,
    ];
    switch (session.type) {
      case 'exchange':
        first += ' на обмен.';
        break;
      case 'foreign':
        first += ' на перестановку.';
        sendRes[0] += ` из ${
          COUNTRIES.find((e) => session.from === e.eng).text
        }`;
        sendRes[1] += ` в ${COUNTRIES.find((e) => session.to === e.eng).text}`;
        break;
    }
    const sender = sendRes.join('\n');
    const contact = `Контакт ${session.senderLink}`;
    const text = [first, time, sender, contact].join('\n\n');
    await ctx.reply(text);
  }

  async fExchange(ctx: Context) {
    const cntx = ctx as any;
    const action = cntx.session.action;
    let word = 'fExchange';
    let text;
    switch (action) {
      case 'give':
        text = 'получаете';
        word = 'exchange-(menu)';
        cntx.session.currency1 = cntx.match[1];
        cntx.session.type = 'foreign';
        break;
      default:
        text = 'отдаете';
        cntx.session.action = 'give';
        cntx.session.to = cntx.match[1];
        break;
    }
    const { to, from } = cntx.session;
    const list = getCurrency(from, to);
    const keyboards = list.map((e) => {
      return [{ text: e, callback_data: `${word}-(${e})` }];
    });
    keyboards.push([{ text: 'Меню', callback_data: '/menu' }]);
    try {
      await cntx.editMessageText(`Что ${text}?`);
      await cntx.editMessageReplyMarkup({
        inline_keyboard: keyboards,
      });
    } catch (e) {}
  }

  async foreign(ctx: Context) {
    const cntx = ctx as any;
    const country = cntx.match[2];
    let messageHead, main;
    if (!country) {
      main = 'foreign';
      messageHead = 'отправки';
    } else {
      cntx.session.from = country;
      main = 'fExchange';
      messageHead = 'получения';
    }
    const countries = COUNTRIES.filter((e) => e.eng !== country).map((e) => [
      {
        text: `${e.sticker} ${e.text}`,
        callback_data: `${main}-(${e.eng})`,
      },
    ]);
    await cntx.editMessageText(`Страна ${messageHead}`, {
      reply_markup: { inline_keyboard: countries },
    });
  }

  async exchangeScenario(ctx: Context) {
    const cntx = ctx as any;
    const action = cntx?.session?.action;
    switch (action) {
      case 'give': {
        await this.whatAction(ctx);
        return;
      }
    }
    const way = cntx.match[1];
    switch (way) {
      case 'menu': {
        await this.exchange(ctx, way);
        break;
      }
      case 'fiat':
      case 'crypt':
        await this.rate(ctx, way);
        break;

      case 'give':
      case 'receive':
        await this.confirmed(ctx, way);
        break;
    }
  }

  async confirmed(ctx: Context, way: string) {
    const cntx = ctx as any;
    const { currency1, currency2 } = cntx.session;
    let text;
    (ctx as any).session.confirmed = way;
    switch (way) {
      case 'receive': {
        text = `Сколько Вы хотите получить ${currency2}?`;
        break;
      }
      case 'give': {
        text = `Сколько Вы хотите отдать ${currency1}?`;
        break;
      }
    }
    (ctx as any).session.text = text;
    await (ctx as any).scene.enter('give-receive');
  }

  async whatAction(ctx: Context) {
    const cntx = ctx as any;
    (ctx as any).session.currency2 = cntx.match[3];
    (ctx as any).session.action = undefined;
    const { currency1, currency2 } = (ctx as any).session;
    await ctx.editMessageText(
      `Вы хотите обменять:\n${currency1} на ${currency2}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Отдать X кол-во ${currency1}`,
                callback_data: `exchange-(give)`,
              },
            ],
            [
              {
                text: `Получить X кол-во ${currency2}`,
                callback_data: `exchange-(receive)`,
              },
            ],
            [{ text: 'Меню', callback_data: '/menu' }],
          ],
        },
      },
    );
  }

  async rate(ctx: Context, way: string) {
    const cntx = ctx as any;
    const session = cntx.session;
    session.type = 'exchange';
    const step1 = session?.currency1;
    let list;
    switch (way) {
      case 'fiat':
        list = FIATS;
        break;
      case 'crypt':
        list = CRYPT;
        break;
    }
    Object.assign(session, {
      action: cntx?.session?.action ? 'give' : 'receive',
    });
    const currency1 = cntx.session.currency1;
    const currency2 = cntx.session.currency2;
    Object.assign(session, { currency1, currency2 });
    (ctx as any).session = session;
    const keyboards = list
      .filter((e) => e !== currency1)
      .map((e) => {
        return [{ text: e, callback_data: `exchange-(menu)-(${e})` }];
      });
    keyboards.push([{ text: 'Меню', callback_data: '/menu' }]);
    try {
      await ctx.editMessageReplyMarkup({
        inline_keyboard: keyboards,
      });
    } catch (e) {}
  }

  async exchange(ctx: Context, way) {
    const cntx = ctx as any;
    const mon = cntx.match[3];
    const step1 = !mon;
    const text = step1 ? 'отдаете' : 'получаете';
    let session = cntx.session;
    if (!step1) {
      session.currency1 = mon;
    } else {
      session = cntx.session;
    }
    (ctx as any).session = session;
    const buttons = [
      [
        { text: 'Фиат', callback_data: `exchange-(fiat)` },
        {
          text: 'Крипта',
          callback_data: `exchange-(crypt)`,
        },
      ],
      [{ text: 'Меню', callback_data: '/menu' }],
    ];
    try {
      await ctx.editMessageText(`Что ${text}?`, {
        reply_markup: { inline_keyboard: buttons },
      });
    } catch (e) {}
  }

  async buy(ctx: any) {
    await ctx.scene.enter('buy');
  }
}
