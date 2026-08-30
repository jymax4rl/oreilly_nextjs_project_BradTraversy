"use client";
import React from "react";

/** Ink-colored hamburger that morphs to X when open. */
const Hamburger = ({ clickFunc, checked }) => {
  return (
    <label className="kama-hamburger inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors hover:bg-black/[0.04] active:bg-black/[0.06] lg:hidden">
      <span className="sr-only">{checked ? "Close menu" : "Open menu"}</span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={clickFunc}
        aria-expanded={checked}
      />
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 text-[#0c1a1a] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] peer-checked:-rotate-45"
        aria-hidden
      >
        <path
          className="origin-center fill-none stroke-current stroke-[1.5] transition-[stroke-dasharray,stroke-dashoffset] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] [stroke-dasharray:12_63] [stroke-linecap:round] [stroke-linejoin:round] peer-checked:[stroke-dasharray:20_300] peer-checked:[stroke-dashoffset:-32.42]"
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
        />
        <path
          className="fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"
          d="M7 16 27 16"
        />
      </svg>
    </label>
  );
};

export default Hamburger;
