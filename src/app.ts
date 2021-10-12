import 'reflect-metadata';
import { createKoaServer, getMetadataArgsStorage, useKoaServer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { BeefyController } from './beefyController';

const routingControllersOptions = {
  controllers: [BeefyController],
};

import Koa from 'koa';
import helmet from 'koa-helmet';
import body from 'koa-bodyparser';
import cors from '@koa/cors';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';

import rt from './middleware/rt';
import powered from './middleware/powered';
// import router from './router';

const app = new Koa();

app.use(rt);
app.use(conditional());
app.use(etag());
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(powered);
app.use(body());

app.context.cache = {};

// app.use(router.routes());
// app.use(router.allowedMethods());

useKoaServer(app, routingControllersOptions);

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`> beefy-api running! (:${port})`);
