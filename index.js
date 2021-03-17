import { handleEvent } from 'flareact'
import { processCronTrigger } from './src/functions/cronTrigger'

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

addEventListener('fetch', (event) => {
  try {
    event.respondWith(addHeaders(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

addEventListener('scheduled', (event) => {
  event.waitUntil(processCronTrigger(event))
})

async function addHeaders(event) {
  let response = handleEvent(event, require.context('./pages/', true, /\.js$/), DEBUG);
  let newHeaders = new Headers(response.headers)

  if (newHeaders.has("Content-Type") && !newHeaders.get("Content-Type").includes("text/html")) {
    return new Response(response.body , {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    })
  }

  console.log(response);

  newHeaders.set("X-Frame-Options", "SAMEORIGIN");
  newHeaders.set("Content-Security-Policy", "frame-ancestors 'none'");

  return new Response(response.body , {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
