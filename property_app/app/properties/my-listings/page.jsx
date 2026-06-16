import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import HomeProperties from "@/components/HomeProperties";
import Link from "next/link";
import { ArrowLeft, LayoutList } from "lucide-react";

export const metadata = {
  title: "My Listings | Kama Properties",
  description: "Manage properties you have listed on Kama Properties",
};

const MyListingsPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  await connectToDatabase();

  const raw = await Property.find({ owner: session.user.id })
    .sort({ updatedAt: -1 })
    .lean();

  const myProperties = raw.map(serializePropertyForClient);

  return (
    <div className="pt-[10vh] bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <LayoutList className="h-8 w-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  My listings
                </h1>
                <p className="text-gray-500 mt-1">
                  {myProperties.length} listing
                  {myProperties.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link
              href="/properties/add"
              className="inline-flex justify-center items-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              List another property
            </Link>
          </div>
        </div>

        <HomeProperties
          initialProperties={myProperties}
          searchQuery=""
          typeFilter=""
          hideSearchToolbar
          hostListingsView
        />
      </div>
    </div>
  );
};

export default MyListingsPage;
