import type { Config, Context } from '@netlify/functions'
import { extractUrlsFromXmlString, extractSitemapUrlsFromXmlString, fetchAndParse} from "#root/netlify/utils/sitemap-utils.mts"

export const config: Config = {
  path: '/functions/sitemap/cache-warm/:target'
}

/**
 * Fetches given sitemap URL and recursively fetches found sitemap URLs
 *
 * @example
 * /functions/sitemap/cache-warm/https%3A%2F%2Fwww.example.com/sitemap.xml
 */
export default async (req: Request, context: Context) => {
  const { target } = context.params

  try {
    const output = []

    // Fetch root entry
    const { error, xmlString, url } = await fetchAndParse(decodeURIComponent(target))

    if (error || !xmlString) throw { error, url }

    const sitemapUrls = extractSitemapUrlsFromXmlString(xmlString)
    output.push({
      sitemap: url,
      urls: sitemapUrls
    })

    // Fetch child entries
    const results = await Promise.allSettled(sitemapUrls.map(fetchAndParse))

    for (const result of results) {
      if (result.status === 'rejected') {
        output.push({
          error: result.reason
        })
        return
      }

      const { error, xmlString, url } = result.value

      if (error || !xmlString) {
        output.push({
          error,
          url
        })
        return
      }

      output.push({
        sitemap: url
      })
    }

    return Response.json(output)
  }
  catch(error: any) {
    return Response.json({
      error: error.error.toString(),
      message: `Error while fetching ${decodeURIComponent(target)}`,
      sitemap: error.url
    })
  }
}