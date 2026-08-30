import React from "react";
import Button from "./Button";
const InfoBoxes = () => {
  return (
    <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 md:py-20">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col justify-between border-t border-zinc-200 pt-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              For travelers
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-zinc-600">
              Browse apartments, houses, and rooms across Africa — stays rooted
              in place, ready when you are.
            </p>
          </div>
          <div className="mt-8">
            <Button
              text="Browse Properties"
              link="/properties"
              borderColor="black"
            />
          </div>
        </div>
        <div className="flex flex-col justify-between border-t border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 to-transparent pt-8 md:pl-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-cyan-950">
              For hosts
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-cyan-900/70">
              Share your space with guests who want authentic African stays —
              list once, welcome travelers year-round.
            </p>
          </div>
          <div className="mt-8">
            <Button text="Add Property" link="/properties/add" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoBoxes;
