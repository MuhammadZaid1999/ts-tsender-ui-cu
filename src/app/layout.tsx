import type { Metadata } from "next";
import "./globals.css";
// import { Providers } from "@/app/providers";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "TSender",
	description: "A simple and fast email sender",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				{/* Wrap the entire body content with Providers */}
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}
