import * as cheerio from 'cheerio';
import {
  ResearcherProfile,
  ProfileListItem,
  ListPageResult,
} from './types.js';

const HONORIFICS = [
  'Emeritus Professor',
  'Associate Professor',
  'Adjunct Professor',
  'Clinical Professor',
  'A/Prof',
  'Assoc Prof',
  'Professor',
  'Prof',
  'Dr',
  'Mr',
  'Mrs',
  'Ms',
  'Miss',
];

/**
 * Extracts title/honorific and separates first and last names if possible.
 */
function parseNameComponents(rawName: string): {
  fullName: string;
  title?: string;
  firstName?: string;
  lastName?: string;
} {
  let cleaned = rawName.replace(/\s+/g, ' ').trim();
  let detectedTitle: string | undefined;

  for (const h of HONORIFICS) {
    if (cleaned.toLowerCase().startsWith(h.toLowerCase() + ' ')) {
      detectedTitle = h;
      cleaned = cleaned.slice(h.length).trim();
      break;
    }
  }

  const parts = cleaned.split(' ');
  let firstName: string | undefined;
  let lastName: string | undefined;

  if (parts.length === 1) {
    firstName = parts[0];
  } else if (parts.length > 1) {
    firstName = parts.slice(0, -1).join(' ');
    lastName = parts[parts.length - 1];
  }

  return {
    fullName: rawName.replace(/\s+/g, ' ').trim(),
    title: detectedTitle,
    firstName,
    lastName,
  };
}

/**
 * Cleans extracted text by stripping HTML tags and collapsing whitespace.
 */
function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves relative URLs to absolute URLs.
 */
function resolveUrl(url: string | null | undefined, baseUrl: string): string {
  if (!url) return '';
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

/**
 * Parse the researcher directory listing page HTML.
 */
export function parseListPage(html: string, baseUrl: string): ListPageResult {
  const $ = cheerio.load(html);
  const items: ProfileListItem[] = [];

  // Each researcher card is contained in .card-content or has .card-title
  $('.card-content, .content-block-container').each((_, element) => {
    const card = $(element);
    const titleLink = card.find('.card-title a, h3 a').first();
    const href = titleLink.attr('href') || card.find('a[href*="/profile/"]').first().attr('href');

    if (!href || !href.includes('/profile/')) return;

    const slug = href.replace(/^.*\/profile\//, '').replace(/[?#].*$/, '').trim();
    if (!slug) return;

    // Avoid duplicates if same slug found on same page
    if (items.some((item) => item.slug === slug)) return;

    const name = cleanText(titleLink.text()) || slug;
    const cardImg = card.find('img').first().attr('src');
    const cardImageUrl = cardImg ? resolveUrl(cardImg, baseUrl) : undefined;

    // Extract subtitles / notes from card
    const cardTextParas = card.find('.card-text p');
    let cardTitle: string | undefined;
    let cardOrganisation: string | undefined;

    cardTextParas.each((idx, p) => {
      const txt = cleanText($(p).text());
      if (idx === 0 && $(p).find('i').length > 0) {
        cardTitle = txt;
      } else if ($(p).find('strong').length > 0) {
        cardOrganisation = txt;
      }
    });

    const cardSupervision = cleanText(card.find('.supervision').text()) || undefined;

    items.push({
      slug,
      name,
      profileUrl: resolveUrl(href, baseUrl),
      cardImageUrl,
      cardTitle,
      cardOrganisation,
      cardSupervision,
    });
  });

  // Determine pagination
  // Drupal pager structure:
  // .pager__item.is-active a -> current page
  // .pager__item--last a[href*="page="] -> last page
  let currentPage = 0;
  const activePageLink = $('.pager__item.is-active a').attr('href') || '';
  const pageMatch = activePageLink.match(/page=(\d+)/);
  if (pageMatch) {
    currentPage = parseInt(pageMatch[1], 10);
  }

  let lastPage = currentPage;
  const lastLink = $('.pager__item--last a').attr('href') || '';
  const lastMatch = lastLink.match(/page=(\d+)/);
  if (lastMatch) {
    lastPage = parseInt(lastMatch[1], 10);
  } else {
    // If no last page link, check highest numeric page link in pagination
    $('.pager__item a').each((_, a) => {
      const h = $(a).attr('href') || '';
      const m = h.match(/page=(\d+)/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > lastPage) lastPage = num;
      }
    });
  }

  const hasNextPage = $('.pager__item--next a').length > 0;

  return {
    items,
    currentPage,
    lastPage,
    hasNextPage,
  };
}

/**
 * Parse an individual researcher profile HTML page.
 */
export function parseProfilePage(
  html: string,
  profileUrl: string,
  baseUrl: string,
  fallbackItem?: Partial<ProfileListItem>
): ResearcherProfile {
  const $ = cheerio.load(html);

  // Extract slug from URL
  const slug =
    profileUrl.replace(/^.*\/profile\//, '').replace(/[?#].*$/, '').trim() ||
    fallbackItem?.slug ||
    'unknown';

  // 1. Full Name
  // Typically in h1.docs-heading (remove .docs-heading-icon), or .banner-content h1, or h1
  const headingElem = $('h1.docs-heading, .docs-heading').first();
  let rawName = '';
  if (headingElem.length > 0) {
    // Clone and remove inner link icons
    const clone = headingElem.clone();
    clone.find('.docs-heading-icon, a, svg, i').remove();
    rawName = cleanText(clone.text());
  }
  if (!rawName) {
    rawName = cleanText($('.banner-content h1').first().text());
  }
  if (!rawName) {
    rawName = cleanText($('h1').first().text());
  }
  if (!rawName && fallbackItem?.name) {
    rawName = fallbackItem.name;
  }
  if (!rawName) {
    rawName = slug.replace(/\./g, ' ');
  }

  const { fullName, title, firstName, lastName } = parseNameComponents(rawName);

  // 2. Positions, Titles, Department, Organisation
  const hdrDesc = cleanText($('p.u-lead-text.hdr-desc').first().text()) || undefined;
  const positionText = cleanText($('p.u-lead-text.position').first().text()) || undefined;
  const department = cleanText($('p.u-lead-text.department').first().text()) || undefined;
  const organisation =
    cleanText($('p.u-lead-text.organisation').first().text()) ||
    fallbackItem?.cardOrganisation ||
    undefined;

  // 3. Contact details from Contact tab
  let contactPosition: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  let campus: string | undefined;

  $('ul.c-icon-detail-list li, .tab-pane li').each((_, li) => {
    const text = $(li).text();
    const strongText = cleanText($(li).find('strong').text()).toLowerCase();

    if (strongText.includes('position')) {
      contactPosition = cleanText(text.replace(/position\s*:/i, ''));
    } else if (strongText.includes('email') || text.includes('@')) {
      const mailto = $(li).find('a[href^="mailto:"]').attr('href');
      if (mailto) {
        email = mailto.replace(/^mailto:/i, '').trim();
      } else {
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) email = emailMatch[0];
      }
    } else if (strongText.includes('phone') || strongText.includes('telephone')) {
      phone = cleanText(text.replace(/(?:phone|telephone)\s*:/i, ''));
    } else if (strongText.includes('campus')) {
      campus = cleanText(text.replace(/campus\s*:/i, ''));
    }
  });

  // Fallback for email: search in social icons or mailto links
  if (!email) {
    const mailto = $('a[href^="mailto:"]').first().attr('href');
    if (mailto) {
      email = mailto.replace(/^mailto:/i, '').split('?')[0].trim();
    }
  }

  // Fallback for phone
  if (!phone) {
    const tel = $('a[href^="tel:"]').first().attr('href');
    if (tel) {
      phone = tel.replace(/^tel:/i, '').trim();
    }
  }

  // Determine standard jobTitle
  const jobTitle =
    positionText ||
    contactPosition ||
    hdrDesc ||
    fallbackItem?.cardTitle ||
    undefined;

  // 4. Bio / Description
  let bio = '';
  const bioContainer = $('.bio .field-name-field-ua-rp-bio, .bio, #tab-pane-0');
  if (bioContainer.length > 0) {
    // Preserve paragraph breaks
    const pTexts: string[] = [];
    bioContainer.find('p').each((_, p) => {
      const t = cleanText($(p).text());
      if (t) pTexts.push(t);
    });
    if (pTexts.length > 0) {
      bio = pTexts.join('\n\n');
    } else {
      bio = cleanText(bioContainer.text());
    }
  }

  // 5. Research Interests
  const interests: string[] = [];
  $('a.research-interest-custom').each((_, a) => {
    const interest = cleanText($(a).text());
    if (interest && !interests.includes(interest)) {
      interests.push(interest);
    }
  });
  if (interests.length === 0) {
    // Alternate selector in accordion or sidebar
    $('.accordion-item:contains("Research Interests") a').each((_, a) => {
      const interest = cleanText($(a).text());
      if (interest && !interests.includes(interest)) {
        interests.push(interest);
      }
    });
  }

  // 6. Supervision
  let supervision = cleanText($('.supervision').first().text()) || undefined;
  if (!supervision) {
    supervision = cleanText($('.available').first().text()) || undefined;
  }
  if (!supervision && fallbackItem?.cardSupervision) {
    supervision = fallbackItem.cardSupervision;
  }

  // 7. Profile Image
  let imageUrl: string | undefined;
  let isDefaultImage = false;

  // Check profile detail large image first
  const profileImg = $(
    '.au-sidenav img, img.figure-img, .node--type-ua-rp-profile img'
  ).first();
  const imgSrc = profileImg.attr('src') || fallbackItem?.cardImageUrl;

  if (imgSrc) {
    imageUrl = resolveUrl(imgSrc, baseUrl);
    if (imgSrc.includes('userphoto.png') || imgSrc.includes('login_user.svg')) {
      isDefaultImage = true;
    }
  }

  // Image filename convention: slug + extension (e.g. banafshe.abadi.png)
  let imageFilename: string | undefined;
  if (imageUrl) {
    try {
      const parsedUrl = new URL(imageUrl);
      const extMatch = parsedUrl.pathname.match(/\.(png|jpe?g|webp|gif)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      imageFilename = `${slug}.${ext === 'jpeg' ? 'jpg' : ext}`;
    } catch {
      imageFilename = `${slug}.jpg`;
    }
  }

  // 8. External Profiles & Social Links
  let linkedinUrl: string | undefined;
  let orcidUrl: string | undefined;
  let googleScholarUrl: string | undefined;
  let researcherIdUrl: string | undefined;
  let scopusUrl: string | undefined;

  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (href.includes('linkedin.com') && !linkedinUrl) {
      linkedinUrl = href;
    } else if (href.includes('orcid.org') && !orcidUrl) {
      orcidUrl = href;
    } else if (href.includes('scholar.google') && !googleScholarUrl) {
      googleScholarUrl = href;
    } else if (href.includes('researcherid.com') && !researcherIdUrl) {
      researcherIdUrl = href;
    } else if (href.includes('scopus.com') && !scopusUrl) {
      scopusUrl = href;
    }
  });

  // 9. Career: Education & Appointments
  const educationEntries: string[] = [];
  const appointmentEntries: string[] = [];

  // Parse tables in the Career tab
  $('table.au-table').each((_, table) => {
    const headerTexts = $(table)
      .find('th')
      .map((_, th) => cleanText($(th).text()).toLowerCase())
      .get();

    const isEducation = headerTexts.includes('title') && headerTexts.includes('country');
    const isAppointment =
      headerTexts.includes('position') && headerTexts.includes('institution name');

    $(table)
      .find('tbody tr')
      .each((_, tr) => {
        const cells = $(tr)
          .find('td')
          .map((_, td) => cleanText($(td).text()))
          .get();

        if (isEducation && cells.length >= 4) {
          // Date, Institution, Country, Title
          const [date, inst, country, degTitle] = cells;
          educationEntries.push(`${degTitle} (${date}, ${inst}, ${country})`.trim());
        } else if (isAppointment && cells.length >= 3) {
          // Date, Position, Institution
          const [date, pos, inst] = cells;
          appointmentEntries.push(`${pos} at ${inst} (${date})`.trim());
        }
      });
  });

  const education = educationEntries.length > 0 ? educationEntries.join('; ') : undefined;
  const appointments = appointmentEntries.length > 0 ? appointmentEntries.join('; ') : undefined;

  return {
    slug,
    fullName,
    title,
    firstName,
    lastName,
    jobTitle,
    leadDescription: hdrDesc,
    department,
    organisation,
    company: 'Adelaide University',
    email,
    phone,
    campus,
    bio: bio || undefined,
    interests,
    supervision,
    profileUrl,
    imageUrl,
    imageFilename,
    imageDownloaded: false,
    isDefaultImage,
    linkedinUrl,
    orcidUrl,
    googleScholarUrl,
    researcherIdUrl,
    scopusUrl,
    education,
    appointments,
    scrapedAt: new Date().toISOString(),
  };
}
