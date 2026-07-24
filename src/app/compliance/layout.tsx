import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance",
  description:
    "MenoDAO is a community-powered healthcare support platform. All payments are in Kenyan Shillings (KES) via licensed mobile money providers. We do not facilitate cryptocurrency transactions.",
  openGraph: {
    title: "Compliance | MenoDAO",
    description:
      "Community-powered dental care platform in Kenya. KES payments via licensed mobile money only.",
    url: "https://app.menodao.org/compliance",
  },
  alternates: {
    canonical: "https://app.menodao.org/compliance",
  },
};

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
