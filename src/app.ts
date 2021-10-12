import 'reflect-metadata';
import { getMetadataArgsStorage, useKoaServer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { BeefyController } from './beefyController';
import * as swaggerUiExpress from 'swagger-ui-express';

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
import { koaSwagger } from 'koa2-swagger-ui';

import Router from 'koa-router';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
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

// Parse routing-controllers classes into OpenAPI spec:
const storage = getMetadataArgsStorage();
// Parse class-validator classes into JSON Schema:
const schemas = validationMetadatasToSchemas({
  classTransformerMetadataStorage: defaultMetadataStorage,
  refPointerPrefix: '#/components/schemas/',
});
const spec = routingControllersToSpec(storage, routingControllersOptions, {
  components: {
    schemas,
  },
  info: {
    description: 'Generated with `routing-controllers-openapi`',
    title: 'A sample API',
    version: '1.0.0',
  },
});

app.use(
  koaSwagger({
    swaggerOptions: {
      spec,
    },
  })
);

const router = new Router();
async function openapi(ctx, next) {
  ctx.body = spec;
  ctx.status = 200;
}
router.get('/', openapi);
app.use(router.routes());

useKoaServer(app, routingControllersOptions);

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`> beefy-api running! (:${port})`);
