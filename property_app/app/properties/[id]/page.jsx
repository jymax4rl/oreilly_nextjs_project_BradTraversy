import React from "react";
export default async function Property({ params }) {
  const { id } = await params;
  console.log("params object:" + id);
  console.table(id);
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <h2 className="text-2xl font-bold">Property</h2>
    </div>
  );
}
