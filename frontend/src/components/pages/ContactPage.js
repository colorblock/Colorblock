import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

export const ContactPage = (props) => {
  return (
    <div>
      <div className='flex m-20 space-x-10'>
        <div className='flex flex-col items-center w-32 text-blue-400'>
          <FontAwesomeIcon icon={fa.faMailBulk} size='lg' />
          Marketing
        </div>
        <span className='pt-1'><a href='mailto:bd@colorblock.art'>bd@colorblock.art</a></span>
      </div>
      <div className='flex m-20 space-x-10'>
        <div className='flex flex-col items-center w-32 text-blue-400'>
          <FontAwesomeIcon icon={fa.faHandshake} size='lg' />
          Partners
        </div>
        <span className='pt-1'><a href='mailto:partners@colorblock.art'>partners@colorblock.art</a></span>
      </div>
      <div className='flex m-20 space-x-10'>
        <div className='flex flex-col items-center w-32 text-blue-400'>
          <FontAwesomeIcon icon={fa.faEnvelopeOpenText} size='lg' />
          Suggestions
        </div>
        <span className='pt-1'><a href='mailto:admin@colorblock.art'>admin@colorblock.art</a></span>
      </div>
    </div>
  );
};

export default ContactPage;
