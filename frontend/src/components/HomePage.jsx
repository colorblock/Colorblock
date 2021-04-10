import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { hideSpinner } from '../store/actions/actionCreators';

const HomePage = props => {
  useEffect(() => {
    const { hideSpinner } = props;
    hideSpinner();
  }, []);

  return (<>Hello HomePage</>);
};

const mapStateToProps = state => ({
  loading: state.present.get('loading')
});
const mapDispatchToProps = dispatch => ({
  hideSpinner: () => dispatch(hideSpinner())
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
