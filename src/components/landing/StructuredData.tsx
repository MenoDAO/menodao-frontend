export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MenoDAO",
    alternateName: ["MenoDAO Kenya", "Meno Dental Care"],
    url: "https://menodao.org",
    logo: "https://menodao.org/logo.png",
    description:
      "A community-driven healthcare financing platform that helps individuals access affordable dental care by pooling contributions and facilitating transparent payments to verified clinics.",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Swahili"],
    },
    sameAs: [
      "https://instagram.com/menodao",
      "https://twitter.com/menodao",
      "https://facebook.com/menodao",
    ],
  };

  const healthServiceSchema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": "https://menodao.org/#organization",
    name: "MenoDAO Dental Care",
    image: "https://menodao.org/logo.png",
    url: "https://menodao.org",
    description:
      "Affordable community-led dental care membership for Kenyans. Access quality dental services including teeth cleaning, fillings, extractions, and emergency dental care.",
    priceRange: "KES 350 - KES 900/month",
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Dental Care Membership Plans",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Silver Membership",
            description:
              "Basic dental care coverage including checkups and teeth cleaning",
          },
          price: "350",
          priceCurrency: "KES",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "350",
            priceCurrency: "KES",
            billingDuration: "P1M",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Gold Membership",
            description:
              "Comprehensive dental care including treatments, fillings, and emergency care",
          },
          price: "700",
          priceCurrency: "KES",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "700",
            priceCurrency: "KES",
            billingDuration: "P1M",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Family Membership",
            description:
              "Full family dental coverage for up to 5 family members",
          },
          price: "900",
          priceCurrency: "KES",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "900",
            priceCurrency: "KES",
            billingDuration: "P1M",
          },
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is MenoDAO?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MenoDAO is a community-driven healthcare financing platform that helps individuals access affordable dental care by pooling contributions and facilitating transparent payments to verified clinics.",
        },
      },
      {
        "@type": "Question",
        name: "How much does MenoDAO membership cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MenoDAO offers three membership tiers: Silver at KES 350/month for basic coverage, Gold at KES 700/month for comprehensive coverage (most popular), and Family at KES 900/month for full family coverage including up to 5 members.",
        },
      },
      {
        "@type": "Question",
        name: "What dental services does MenoDAO cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MenoDAO covers a wide range of dental services including dental checkups, teeth cleaning, tooth extractions, dental fillings, root canal treatment, dental crowns, and emergency dental care depending on your membership tier.",
        },
      },
      {
        "@type": "Question",
        name: "How do I join MenoDAO?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Joining MenoDAO is easy! Simply visit our website, fill out the registration form with your details, choose your preferred membership package, and start making monthly contributions via M-Pesa. You can access dental services after your first contribution.",
        },
      },
      {
        "@type": "Question",
        name: "Where can I access dental care with MenoDAO?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MenoDAO has partnered with dental clinics across Kenya, including major cities like Nairobi, Mombasa, Kisumu, and Nakuru. Members can access care at any of our partner clinics.",
        },
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MenoDAO",
    url: "https://menodao.org",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://menodao.org/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(healthServiceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}
