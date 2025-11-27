"use client";
import React from "react";
import styled from "styled-components";

const Pattern = ({ children }) => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="content">{children}</div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  .container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Add your background pattern here */
    background-color: white;
    background-image: radial-gradient(
      rgba(44, 43, 43, 0.34) 2px,
      transparent 0
    );
    background-size: 30px 30px;
    background-position: -5px -5px;
    z-index: 0;
  }

  .content {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
  }
`;

export default Pattern;
