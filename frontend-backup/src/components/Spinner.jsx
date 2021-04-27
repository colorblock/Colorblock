import React, { useState } from 'react';
import { connect } from 'react-redux';
import { css } from "@emotion/react";
import GridLoader from "react-spinners/GridLoader";

// Can be a string as well. Need to ensure each key-value pair ends with ;
const override = css`
  display: block;
  margin: 0 auto;
  margin-top: 200px;
`;

const Spinner = ({ loading }) => {
  return (
    <div className="sweet-loading">
      <GridLoader css={override} size={15} color={"#000000"} loading={loading} speedMultiplier={1.5} />
    </div>
  );
};

const mapStateToProps = state => ({
  loading: state.present.get('loading')
});

export default connect(mapStateToProps)(Spinner);
