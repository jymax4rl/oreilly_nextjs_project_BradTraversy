import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import HomeProperties from "@/components/HomeProperties";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Saved Properties | Kama Properties",
  description: "Your saved favorite properties on Kama Properties",
};

const SavedPropertiesPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[10vh]">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your saved properties.
          </p>
          <Link
            href="/login"
            className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  await connectToDatabase();

  const user = await User.findOne({ email: session.user.email })
    .populate("bookmarks")
    .lean();

  const savedProperties = (user?.bookmarks || []).map(serializePropertyForClient);

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
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Saved Properties
            </h1>
          </div>
          <p className="text-gray-500 mt-1">
            {savedProperties.length} property
            {savedProperties.length !== 1 ? "ies" : "y"} saved
          </p>
        </div>

        {savedProperties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No Saved Properties Yet
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Click the heart icon on any property card to save it here for
              quick access.
            </p>
            <Link
              href="/properties"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition font-medium"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <HomeProperties
            initialProperties={savedProperties}
            searchQuery=""
            typeFilter=""
            isSavedView={true}
          />
        )}
      </div>
    </div>
  );
};

export default SavedPropertiesPage;
