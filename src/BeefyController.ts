import { Controller, Param, Body, Get, Post, Put, Delete } from 'routing-controllers';
import { getApys } from './api/stats/getApys';

@Controller()
export class BeefyController {
  @Get('/apy')
  async apy() {
    let apyObject = await getApys();
    let apys = apyObject.apys;

    if (Object.keys(apys).length === 0) {
      throw 'There is no APYs data yet';
    }
    return apys;
  }

  //   @Get('/users/:id')
  //   getOne(@Param('id') id: number) {
  //     return 'This action returns user #' + id;
  //   }

  //   @Post('/users')
  //   post(@Body() user: any) {
  //     return 'Saving user...';
  //   }

  //   @Put('/users/:id')
  //   put(@Param('id') id: number, @Body() user: any) {
  //     return 'Updating a user...';
  //   }

  //   @Delete('/users/:id')
  //   remove(@Param('id') id: number) {
  //     return 'Removing user...';
  //   }
}
