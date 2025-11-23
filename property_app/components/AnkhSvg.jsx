'use client'
import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * AnkhSvg Component
 * 
 * @param {string} className - CSS classes.
 * @param {string} color - Unused if gradient is active, but kept for compatibility.
 */
/**
 * AnkhSvg Component
 * 
 * @param {string} className - CSS classes.
 * @param {string} color - Unused if gradient is active, but kept for compatibility.
 */
const AnkhSvgRefined = ({ className = "", color = "url(#crystalGradient)", ...props }) => {
  const container = useRef();
  const gradientRef = useRef();

  const { contextSafe } = useGSAP({ scope: container });

  const onMouseEnter = contextSafe(() => {
    gsap.fromTo(
      gradientRef.current,
      { attr: { x1: "-100%", x2: "0%" } },
      {
        attr: { x1: "200%", x2: "300%" },
        duration: 1.5,
        ease: "power2.inOut",
      }
    );
  });

  return (
    <svg
      ref={container}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill={color}
      onMouseEnter={onMouseEnter}
      {...props}
    >
      <defs>
        <linearGradient 
          ref={gradientRef}
          id="crystalGradient" 
          x1="-100%" y1="0%" x2="0%" y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#e0f7fa" />
          <stop offset="20%" stopColor="#a9d6dcff" />
          <stop offset="45%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#51878eff" />
          <stop offset="55%" stopColor="#ffffff" />
          <stop offset="90%" stopColor="#99d6e0ff" />
          <stop offset="100%" stopColor="#010b0bff" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* 
          Path construction:
          1. Vertical bar: 11,11 to 11,22 to 13,22 to 13,11
          2. Cross bar: 8,11 to 16,11 (height 2? 11 to 13 is overlap? Let's say crossbar is 9 to 11)
          Let's adjust Y coordinates.
          Crossbar top: 9, bottom: 11.
          Vertical bar top: 11, bottom: 22.
          Loop bottom: 9.
          
          Loop shape:
          Starts at 12,9 (center bottom of loop).
          Goes out to 15,5 (approx).
          Arc top to 9,5.
          Line back to 12,9.
          
          Let's trace the outline to make it a single shape.
          Start 11,9 (Top-left of intersection).
          Line to 8,9 (Left crossbar top).
          Line to 8,11 (Left crossbar bottom).
          Line to 11,11 (Left vertical top).
          Line to 11,22 (Bottom left).
          Line to 13,22 (Bottom right).
          Line to 13,11 (Right vertical top).
          Line to 16,11 (Right crossbar bottom).
          Line to 16,9 (Right crossbar top).
          Line to 13,9 (Top-right of intersection).
          
          Now the loop:
          Line to 15,4 (Right side of triangle).
          Arc around top: A 3 3 0 1 0 9 4.
          Line to 11,9 (Left side of triangle).
          Close.
          
          Hole:
          M 12,8
          L 10.5,4.5
          A 1.5 1.5 0 1 1 13.5,4.5
          L 12,8
          Z
      */}
      <path 
        fillRule="evenodd"
        d="M11,9 L8,9 L8,11 L11,11 L11,22 L13,22 L13,11 L16,11 L16,9 L13,9 
           C 13.5,8 15.5,7 15.5,4.5 
           A 3.5 3.5 0 1 0 8.5,4.5 
           C 8.5,7 10.5,8 11,9 Z 
           
           M12,7.5 
           C 11.2,6.5 10.5,5.5 10.5,4.5 
           A 1.5 1.5 0 1 1 13.5,4.5 
           C 13.5,5.5 12.8,6.5 12,7.5 Z" 
        filter="url(#glow)"
      />
    </svg>
  );
};

export default AnkhSvgRefined;
