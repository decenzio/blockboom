import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const explicitUrl = process.env.NEXT_PUBLIC_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;
  const baseUrl = explicitUrl || vercelUrl || `http://localhost:${process.env.PORT || 3000}`;

  const baseMeta = getMetadata({
    title: "Scaffold-ETH 2 App",
    description: "Built with 🏗 Scaffold-ETH 2",
  });

  return {
    ...baseMeta,
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${baseUrl}/thumbnail.jpg`,
        button: {
          title: "Launch BlockBoom",
          action: {
            type: "launch_miniapp",
            name: "BlockBoom",
            url: baseUrl,
            splashImageUrl: `${baseUrl}/thumbnail.jpg`,
            splashBackgroundColor: "#000000",
          },
        },
      }),
    },
  };
}

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
