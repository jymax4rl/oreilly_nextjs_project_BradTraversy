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
        <div>{children}</div>
      </body>
    </html>
  );
}

export default MainLayout;
