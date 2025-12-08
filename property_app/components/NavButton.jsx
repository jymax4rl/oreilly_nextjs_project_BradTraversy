"use client";
import React from "react";
import styled from "styled-components";

const NavButton = ({ text, href, clickFunc }) => {
  return (
    <StyledWrapper>
      <button
        className="cta text-white hidden lg:block"
        onClick={clickFunc}
        href={href}
      >
        <span className="hover-underline-animation"> {text} </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .cta {
    border: none;
    background: none;
    cursor: pointer;
  }

  .cta span {
    padding-bottom: 7px;
    letter-spacing: 2px;
    font-size: 12px;
    text-transform: uppercase;
  }

  .hover-underline-animation {
    position: relative;
    padding-bottom: 20px;
  }

  .hover-underline-animation:after {
    content: "";
    position: absolute;
    width: 100%;
    transform: scaleX(0);
    height: 1px;
    bottom: 0;
    left: 0;
    background-color: #000000;
    transform-origin: bottom right;
    transition: transform 0.25s ease-out;
  }

  .cta:hover .hover-underline-animation:after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }
`;

export default NavButton;
