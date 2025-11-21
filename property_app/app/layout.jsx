import "@/assets/styles/globals.css";

import React from "react";

export const metadata = {
  title: "Nextjs course",
  description: "Learning Nextjs with MongoDB",
  keywords: "Nextjs React & MongoDb",
};

function MainLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="pt-20 h-80 ">{children}</main>
      </body>
    </html>
  );
}

export default MainLayout;
