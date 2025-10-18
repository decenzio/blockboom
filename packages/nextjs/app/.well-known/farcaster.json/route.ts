export async function GET() {
  const explicitUrl = process.env.NEXT_PUBLIC_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;
  const baseUrl = explicitUrl || vercelUrl || `http://localhost:${process.env.PORT || 3000}`;

  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    baseBuilder: {
      allowedAddresses: [""] /* add your Base Account address here */,
    },
    miniapp: {
      version: "1",
      name: "RANKr",
      homeUrl: baseUrl,
      iconUrl: `${baseUrl}/logo.svg`,
      splashImageUrl: `${baseUrl}/thumbnail.jpg`,
      splashBackgroundColor: "#FFD700",
      webhookUrl: `${baseUrl}/api/webhook`,
      subtitle: "Fast, fun, social",
      description: "A fast, fun way to challenge friends in real time.",
      screenshotUrls: [`${baseUrl}/s1.png`, `${baseUrl}/s2.png`, `${baseUrl}/s3.png`],
      primaryCategory: "social",
      tags: ["RANKr", "miniapp", "baseapp"],
      heroImageUrl: `${baseUrl}/og.png`,
      tagline: "Play instantly",
      ogTitle: "RANKr",
      ogDescription: "Challenge friends in real time.",
      ogImageUrl: `${baseUrl}/og.png`,
      noindex: true,
    },
  } as const;

  return Response.json(manifest);
}
