import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import "./global.css";

import { ThemeProvider } from "@/components/theme-provider";

import { WagmiConfig } from "wagmi";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";

import { arbitrum, mainnet } from "viem/chains";

import Header from "./components/header";

import Home from "./routes/Home";
import Create from "./routes/Create";
import Edit from "./routes/Edit";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/create",
    element: <Create />,
  },
  {
    path: "/edit",
    element: <Edit />,
  },
]);

// 1. Get projectId
const projectId = "89f44da207028b98a54a9fd6a323019b"; // TODO: move to env

// 2. Create wagmiConfig
const metadata = {
  name: "Web3Modal",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [mainnet, arbitrum];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <WagmiConfig config={wagmiConfig}>
        <Header />

        <div className="container">
          <RouterProvider router={router} />
        </div>
      </WagmiConfig>
    </ThemeProvider>
  </React.StrictMode>
);
