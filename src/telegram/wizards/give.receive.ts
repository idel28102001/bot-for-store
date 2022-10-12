import e from 'express';
import { Context, Wizard, WizardStep } from 'nestjs-telegraf';
import { UsersService } from 'src/users/services/users.service';
import { Scenes } from 'telegraf';
import { Context as Ctx } from 'vm';
import { calcAmo, min } from '../../common/validate';

@Wizard('give-receive')
export class GiveReceive {
  private allCurrencies;
  private mainIdx;
  private action;
  private session;

  constructor(private readonly usersService: UsersService) {}

  @WizardStep(1)
  async step1(@Context() ctx: Scenes.WizardContext) {
    const cntx = ctx as any;
    const { currency1, currency2 } = cntx.session;
    const firstText = cntx.session.text;
    this.mainIdx = cntx.session.confirmed === 'give' ? 0 : 1;
    this.allCurrencies = [currency1, currency2];
    this.action = cntx.session.confirmed;
    this.session = cntx.session;
    try {
      await ctx.deleteMessage();
    } catch (e) {}
    await ctx.reply(`${firstText} Для отмены введите /exit`);
    ctx.wizard.next();
  }

  async deleteMessage(ctx) {
    try {
      await ctx.deleteMessage();
      await ctx.deleteMessage();
    } catch (e) {}
  }

  @WizardStep(2)
  async step2(@Context() ctx: Scenes.WizardContext) {
    const result = ctx.update as unknown as { message: { text: string } };
    const text = result.message.text;
    if (text === '/exit') {
      try {
        await ctx.scene.leave();
        return;
      } catch (e) {}
    }
    if (!/^\d+$/.test(text)) {
      await this.deleteMessage(ctx);
      await ctx.reply('Введите число');
      await ctx.wizard.selectStep(1);
      return;
    }
    const userAmount = Number(text);
    const currRes = min(userAmount, this.allCurrencies[this.mainIdx]);
    await this.deleteMessage(ctx);
    if (!currRes.isBigger) {
      await ctx.reply(
        `Для ${this.allCurrencies[this.mainIdx]} минимальное значение = ${
          currRes.min
        }. Попробуйте ещё раз.`,
      );
      await ctx.wizard.selectStep(1);
    } else {
      const calcAmount = calcAmo(userAmount, this.allCurrencies, this.mainIdx);
      const text = `За ${calcAmount[0]} ${this.allCurrencies[0]} вы получите ${calcAmount[1]} ${this.allCurrencies[1]}.`;
      const username = (ctx as any).update.message.from.username;
      const id = (ctx as any).update.message.from.id;
      const link = username ? `https://t.me/${username}` : 'Ссылка отсутсвует';
      const session = {
        id: 1,
        telegramId: id,
        senderLink: link,
        type: this.session.type,
        to: this.session.to,
        from: this.session.from,
        toSend: {
          currency: this.allCurrencies[0],
          amount: calcAmount[0],
        },
        toGet: {
          currency: this.allCurrencies[1],
          amount: calcAmount[1],
        },
      };

      (ctx as any).session = session;
      await ctx.reply(
        `${text}\nЕсли Вас устраивает курс, вы можете оставить заявку.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Оставить заявку',
                  callback_data: 'request-(yes)',
                },
              ],
              [{ text: 'Передумал', callback_data: 'request-(no)' }],
            ],
          },
        },
      );
      await ctx.scene.leave();
    }
  }
}
