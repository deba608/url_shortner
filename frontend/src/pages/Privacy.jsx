import LegalPage from "@/components/LegalPage";
import { BRAND_NAME } from "@/utils/constants";

// Static Privacy Policy. Replace with reviewed legal copy before production.
const sections = [
  {
    heading: "1. Information we collect",
    body: [
      `Account information: the email address you provide when registering with ${BRAND_NAME}.`,
      "Link and usage data: the original URLs you shorten, custom aliases, and expiration settings you choose.",
      "Click analytics: for links you own, we record aggregated click data such as timestamps, IP addresses (for unique-visitor counts), and user agents.",
    ],
  },
  {
    heading: "2. How we use information",
    body: "We use the information we collect to operate, maintain, and improve the Service, to provide analytics for your links, and to protect against abuse.",
  },
  {
    heading: "3. Cookies and authentication",
    body: "We use an HTTP-only authentication cookie (or a Bearer token) to keep you signed in. We do not use advertising or third-party tracking cookies.",
  },
  {
    heading: "4. Data retention",
    body: "We retain your account and link data for as long as your account is active. Click analytics are retained for the purpose of providing historical stats and may be aggregated or deleted over time.",
  },
  {
    heading: "5. Sharing",
    body: `We do not sell your personal information. We may share data with service providers (such as email delivery) strictly to operate the Service, or when required by law.`,
  },
  {
    heading: "6. Your choices",
    body: "You can delete your links at any time. You may request deletion of your account by contacting us.",
  },
  {
    heading: "7. Contact",
    body: `If you have questions about this Privacy Policy, please contact the ${BRAND_NAME} team.`,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="June 17, 2026"
      sections={sections}
    />
  );
}
