import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { documentReady } from "./document-ready";
import { Profile } from "./Profile";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import "src/styles/theme.module.css";
import { VStack } from "structure-kit";
import { Stats } from "src/components/Stats";
import { getAccountDataMemoized } from "src/shared/account-resolving/account-data";
import { ErrorBoundary } from "src/components/ErrorBoundary";

function CardContent({ name }: { name: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["getAccountDataMemoized", name],
    queryFn: () => getAccountDataMemoized(name),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  if (!data) {
    return null;
  }
  if (isLoading) {
    return null;
  }
  const { domain, address } = data;
  if (!address) {
    throw new Error(`address resolution failed: ${name}`);
  }

  return (
    <VStack gap={24}>
      <Profile address={address} domain={domain} />
      <ErrorBoundary
        renderError={(error) => <span>Render error: {error?.message}</span>}
      >
        <Stats address={address} />
      </ErrorBoundary>
    </VStack>
  );
}

interface Props {
  id: string;
  name: string;
}

function Card({ name, id }: Props) {
  const [style, setDisplay] = useState({ display: "none", top: 0, left: 0 });
  useEffect(() => {
    const addressElement = document.getElementById(id);
    if (!addressElement) {
      return;
    }
    const handleMouseEnter = () => {
      const { height, y, x } = addressElement.getBoundingClientRect();
      const { scrollLeft, scrollTop } = document.documentElement;
      setDisplay({
        display: "block",
        top: scrollTop + y + height + 12,
        left: scrollLeft + x,
      });
    };
    const handleMouseLeave = () => {
      setDisplay({ display: "none", left: 0, top: 0 });
    };
    addressElement?.addEventListener("mouseenter", handleMouseEnter);
    // addressElement?.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      addressElement?.removeEventListener("mouseenter", handleMouseEnter);
      addressElement?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);
  if (style.display === "none") {
    return;
  }
  return (
    <div
      style={{
        display: style.display,
        top: style.top,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        left: style.left,
        padding: 20,
        // border: "2px solid #6f42c1", // Adding a border with a fancy color (#6f42c1)
        position: "absolute",
        zIndex: 10,
        backgroundColor: "white",
        borderRadius: "20px", // Adding rounded corners
        // boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Adding a subtle box-shadow
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 5px 8px 2px",
        // backgroundImage: "linear-gradient(135deg, #f49b00, #6f42c1, #18a5a5)", // Fancy gradient background
        // color: "#fff",
        fontSize: "18px",
      }}
    >
      <React.Suspense fallback={<span>loading card...</span>}>
        <CardContent name={name} />
      </React.Suspense>
    </div>
  );
}

let cardsElement: HTMLElement | null = null;

async function prepare() {
  await documentReady();
  cardsElement = document.createElement("div");
  cardsElement.dataset.intent = "cards-root";
  document.body.appendChild(cardsElement);
}

prepare();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
      useErrorBoundary: true,
    },
  },
});

export function addCard(props: Props) {
  const card = document.createElement("div");
  cardsElement?.appendChild(card);
  createRoot(card).render(
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<p>loading...</p>}>
        <Card {...props} />
      </React.Suspense>
    </QueryClientProvider>
  );
}
