import React from "react";

function Hero() {
  return (
    <div className="w-full h-[45vh] ">
      <main className="  h-[65vh] bg-white/20 flex flex-col items-center justify-center  pb-32 px-4 w-full">
        {/* Background Elements (Required for glass effect to be visible) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-cyan-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
        </div>
        {/* <!-- Main Glass Container --> */}
        <div className="relative z-10 p-6  w-full max-w-2xl">
          <div className="relative w-full  rounded-3xl border-none bg-white/10 backdrop-blur-3xl hover:bg-white/20 p-10 md:p-14 shadow-2xl shadow-black/10 hover:shadow-white/10 transition-all duration-800 ease-in-out">
            {/* Content */}
            {/* <!-- Hero Text --> */}
            <div className="relative z-10  text-black space-y-6 text-center">
              <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-gradient leading-[1.1]">
                Find your <br />
                perfect dream home
              </h1>

              <p className="text-lg hover:text-black transition-all duration-300 md:text-md cursor-pointer text-black/50 font-light leading-relaxed max-w-lg mx-auto">
                Find your perfect dream home.
              </p>
            </div>

            {/* Subtle shine effect on top edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Hero;
