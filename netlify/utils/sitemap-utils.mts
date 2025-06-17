import createError from 'http-errors'

export const extractUrlsFromXmlString = (xmlString: string, customRegex?: RegExp) => {
  const defaultRegex = /<loc>([^<]*)<\/loc>/gm
  const matches = []
  let match: RegExpExecArray | null

  const regex = customRegex || defaultRegex

  while ((match = regex.exec(xmlString)) !== null) {
    matches.push(match[1])
  }

  return matches
}

export const extractSitemapUrlsFromXmlString = (xmlString: string) => {
  const regex = /<sitemap>\s*<loc>(?<url>[^<]*)<\/loc>/gm
  return extractUrlsFromXmlString(xmlString, regex)
}

export const fetchAndParse = async (url: string) => {
  try {
    const response = await fetch(url)

    if (!response.ok)
      throw createError(response.status, response.statusText)

    const contentType = response.headers.get('content-type')

    if (!contentType?.includes('application/xml'))
      throw createError(response.status, 'Not supported content-type')

    const xmlString = await response.text()

    return {
      xmlString,
      url
    }
  } catch (error) {
    return {
      error,
      url
    }
  }
}