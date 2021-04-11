import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Notifications = ({ notifications }) => {

  useEffect(() => {
    console.log('in notification', notifications);
    notifications.map(item => toast.success(item.message));
  }, [notifications]);

  return <ToastContainer />
};

const mapStateToProps = state => ({
  notifications: state.present.get('notifications')
});

export default connect(mapStateToProps)(Notifications);
