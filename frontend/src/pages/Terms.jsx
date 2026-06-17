import LegalPage from "@/components/LegalPage";
import { BRAND_NAME } from "@/utils/constants";

// Static Terms of Service. Replace the body text with your reviewed legal copy
// before going to production — this is a reasonable starting template.
const sections = [
  {
    heading: "1. Acceptance of terms",
    body: `By accessing or using ${BRAND_NAME} (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.`,
  },
  {
    heading: "2. Description of service",
    body: `${BRAND_NAME} provides a URL shortening service that lets you create shorter, shareable links and view basic click analytics for links you own.`,
  },
  {
    heading: "3. Acceptable use",
    body: [
      "You agree not to use the Service to shorten links that point to unlawful, harmful, infringing, or malicious content, including spam, phishing, or malware.",
      "You are solely responsible for the destinations of any links you create.",
      "We reserve the right to disable any link that violates these terms or applicable law.",
    ],
  },
  {
    heading: "4. Accounts",
    body: "To access analytics and manage your links you may need to create an account. You are responsible for keeping your credentials secure and for all activity under your account.",
  },
  {
    heading: "5. Link availability",
    body: "We do not guarantee that any shortened link will remain available indefinitely. Links may expire, be deleted by their owner, or be removed by us in accordance with these terms.",
  },
  {
    heading: "6. Limitation of liability",
    body: `The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, ${BRAND_NAME} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.`,
  },
  {
    heading: "7. Changes",
    body: "We may update these terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised terms.",
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="June 17, 2026"
      sections={sections}
    />
  );
}
