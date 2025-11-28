"use client";
import Image from "next/image";

const ProjectCard = () => {
  return (
    <>
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center p-6 antialiased text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {/* <!-- Card Container --> */}

        <div className="w-full max-w-sm bg-white border border-neutral-900 rounded-2xl p-6 shadow-[0px_4px_0px_0px_rgba(23,23,23,1)] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px_rgba(23,23,23,1)] transition-all duration-300 ease-out"></div>
      </div>
    </>
  );
};

export default ProjectCard;
