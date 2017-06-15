import React from 'react';
import Box from 'react-layout-components';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Logo from './img/DTT_Logo.png';

const I = p =>
  <i
    className={`fa fa-${p.t}`}
    style={{ paddingRight: 8 }}
    aria-hidden="true"
  />;

const L = styled(Link)`
  color: rgb(46, 46, 46);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${p => (p.last ? 'auto' : 0)};
  width: 120px;
  height: 100%;
  &:hover {
    background-color: rgb(212, 212, 212);
  }
`;

export default () =>
  <Box height={50} alignItems="center">
    <img
      src={Logo}
      style={{ width: 300, height: 40, transform: 'scale(0.9)' }}
    />
    <L to="/">
      <I t="download" />
      <span>Download</span>
    </L>
    <L to="/log">
      <I t="file-text-o" />
      <span>Log</span>
    </L>
    <L to="/settings" last>
      <I t="cog" />
    </L>
  </Box>;
