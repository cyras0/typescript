import { ReactNode } from "react";
import Navbar from "./components/Navbar";
import './globals.css';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
};

export default Layout;