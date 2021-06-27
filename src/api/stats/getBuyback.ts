const getBifi = require('./getBifiBuyback');

const TIMEOUT = 5 * 60 * 1000;

async function getBuyback(ctx) {
  try {
    ctx.request.socket.setTimeout(TIMEOUT);
    let bifibuyback = await getBifi();
    if (!bifibuyback) {
      throw 'There is no bifibuyback data yet';
    }

    ctx.status = 200;
    ctx.body = bifibuyback;
  } catch (err) {
    ctx.throw(500, err);
  }
}

module.exports = { getBuyback };
