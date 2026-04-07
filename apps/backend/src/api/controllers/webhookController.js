import prisma from '../../lib/prisma.js';

/**
 * Fountain may send `{ applicant: { ... } }` or a flatter payload.
 * @param {object} webhookData
 */
function getApplicant(webhookData) {
  return webhookData?.applicant ?? webhookData;
}

/**
 * Prefer `addresses[0]` (normalized). Fallback: `data.address` array (strings + geo object).
 * @param {object} applicant
 */
function formatApplicantAddress(applicant) {
  const addr = applicant?.addresses?.[0];
  if (addr && (addr.street_name || addr.city)) {
    const line1 = [addr.street_name, addr.address_2].filter(Boolean).join(', ');
    const line2 = [addr.city, addr.state, addr.zipcode].filter(Boolean).join(', ');
    return [line1, line2, addr.country].filter(Boolean).join(', ');
  }

  const raw = applicant?.data?.address;
  if (!Array.isArray(raw)) return null;

  const geo = raw.find(
    (x) => x && typeof x === 'object' && !Array.isArray(x) && (x.city || x.street_address)
  );
  const strings = raw.filter((x) => typeof x === 'string');
  if (geo) {
    const street = geo.street_address || strings[0];
    const line1 = [street, strings[1] || geo.address_2].filter(Boolean).join(', ');
    const line2 = [
      geo.city,
      geo.state_code_iso || geo.state_code,
      geo.postal_code,
    ].filter(Boolean).join(', ');
    return [line1, line2, geo.country_code_iso || geo.country_code].filter(Boolean).join(', ');
  }
  if (strings.length) return strings.join(', ');
  return null;
}

/**
 * Driver home location: `addresses[0]`, else geo object inside `data.address`.
 * Last resort: funnel office location (not the driver's home).
 * @param {object} applicant
 */
function extractCityAndCountry(applicant) {
  const addr = applicant?.addresses?.[0];
  if (addr?.city) {
    return {
      city: addr.city,
      country: addr.country || null,
    };
  }

  const raw = applicant?.data?.address;
  if (Array.isArray(raw)) {
    const geo = raw.find(
      (x) => x && typeof x === 'object' && !Array.isArray(x) && x.city
    );
    if (geo) {
      return {
        city: geo.city || null,
        country: geo.country_code_iso || geo.country_code || null,
      };
    }
  }

  return {
    city:
      applicant?.funnel?.location?.address_detail?.city ||
      applicant?.funnel?.location?.name ||
      null,
    country: applicant?.funnel?.location?.address_detail?.country_code || null,
  };
}

export const handleFountainWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    if (!webhookData) {
      return res.status(400).json({ success: false, error: 'No data received' });
    }

    const {
      email,
      phone,
      phone_number,
      mobile,
      name,
      first_name,
      last_name,
      applicant_id,
      application_id,
      stage,
      status,
      city,
      data,
    } = webhookData;

    const a = getApplicant(webhookData);

    const applicantEmail = (
      email ||
      data?.email ||
      a?.email ||
      ''
    )
      .toLowerCase()
      .trim();

    const applicantPhone =
      phone ||
      phone_number ||
      mobile ||
      data?.phone ||
      data?.phone_number ||
      a?.phone_number ||
      a?.normalized_phone_number ||
      a?.phone;

    const applicantName =
      name ||
      `${first_name || ''} ${last_name || ''}`.trim() ||
      data?.name ||
      a?.name ||
      [a?.first_name, a?.last_name].filter(Boolean).join(' ') ||
      null;

    const applicantId =
      applicant_id || application_id || data?.applicant_id || a?.id;

    if (!applicantEmail) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { city: homeCity, country: homeCountry } = extractCityAndCountry(a);

    const locationCity =
      homeCity ||
      webhookData.applicant?.funnel?.location?.address_detail?.city ||
      webhookData.funnel?.location?.address_detail?.city ||
      webhookData.applicant?.funnel?.location?.city ||
      webhookData.funnel?.location?.city ||
      webhookData.location?.city ||
      city ||
      null;

    const locationCountry =
      homeCountry ||
      webhookData.applicant?.funnel?.location?.address_detail?.country_code ||
      webhookData.funnel?.location?.address_detail?.country_code ||
      webhookData.location?.country_code ||
      null;

    const funnel = a?.funnel || webhookData.funnel || data?.funnel;
    const funnelId = funnel?.id ? String(funnel.id) : null;
    const funnelTitle = funnel?.title || null;

    const mot = a?.data?.mot ?? data?.mot ?? null;

    const formattedAddress = formatApplicantAddress(a);

    const stageLabel =
      (typeof a?.stage === 'object' && a?.stage?.title) ||
      (typeof a?.stage === 'string' ? a.stage : null) ||
      stage ||
      null;

    const applicantData = {
      email: applicantEmail,
      phone: applicantPhone || null,
      name: applicantName || null,
      applicantId: applicantId ? String(applicantId) : null,
      funnelId,
      funnelTitle,
      mot,
      address: formattedAddress,
      stage: stageLabel,
      status: status || null,
      city: locationCity,
      country: locationCountry,
      fountainData: webhookData,
      webhookReceivedAt: new Date().toISOString(),
      updatedAt: new Date(),
    };

    await prisma.fountainApplicant.upsert({
      where: { email: applicantEmail },
      update: applicantData,
      create: { ...applicantData, createdAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Applicant data received and stored successfully',
      email: applicantEmail,
      applicantId: applicantId,
    });
  } catch (error) {
    console.error('Error processing Fountain webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
};
