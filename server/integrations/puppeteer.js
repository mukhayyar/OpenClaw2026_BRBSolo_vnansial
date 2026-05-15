/**
 * Optional Puppeteer fallback for sites that block JSON fetches
 * (specifically idx.co.id which 403s server-side requests).
 *
 * Activated only when `VNANSIAL_USE_PUPPETEER=1` AND `puppeteer-core`
 * + `@sparticuz/chromium` are installed. Both are HEAVY (~300MB),
 * so they're not in package.json by default. Add them manually if you
 * need IDX details from a region that's getting blocked:
 *
 *     npm install puppeteer-core @sparticuz/chromium
 *
 * Dockerfile.full image includes them pre-installed.
 */

const ENABLED = process.env.VNANSIAL_USE_PUPPETEER === '1'

let browserPromise = null

async function getBrowser() {
  if (!ENABLED) return null
  if (browserPromise) return browserPromise
  browserPromise = (async () => {
    try {
      const { default: puppeteer } = await import('puppeteer-core')
      const chromium = (await import('@sparticuz/chromium')).default
      return puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      })
    } catch (err) {
      console.warn('[puppeteer] not available:', err.message)
      browserPromise = null
      return null
    }
  })()
  return browserPromise
}

export async function fetchWithBrowser(url, opts = {}) {
  if (!ENABLED) {
    return { error: 'puppeteer_disabled', hint: 'Set VNANSIAL_USE_PUPPETEER=1 and install puppeteer-core + @sparticuz/chromium.' }
  }
  const browser = await getBrowser()
  if (!browser) return { error: 'puppeteer_unavailable' }

  const page = await browser.newPage()
  try {
    await page.setUserAgent(opts.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 })
    const body = await page.content()
    return { ok: true, body, url }
  } catch (err) {
    return { error: err.message }
  } finally {
    await page.close()
  }
}

export const PUPPETEER_ENABLED = ENABLED
