import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useFormik } from 'formik';
import { WithContext as ReactTags } from 'react-tag-input';

const Form = ({ onSubmit, frames }) => {

  const [tags, setTags] = useState([]);

  const handleDelete = (i) => {
    setTags(tags.filter((tag, index) => index !== i));
  }

  const handleAddition = (tag) => {
    setTags([...tags, tag]);
  }

  const handleDrag = (tag, currPos, newPos) => {
    const tags = [...tags];
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    setTags(newTags);
  }
  const KeyCodes = {
    comma: 188,
    enter: 13,
  };
  const delimiters = [KeyCodes.comma, KeyCodes.enter];


  // Pass the useFormik() hook initial form values and a submit function that will
  // be called when the form is submitted
  const formik = useFormik({
    initialValues: {
      title: '',
      description: ''
    },
    onSubmit: values => {
      values.tags = tags.map(tag => tag.text);
      onSubmit(values);
    }
  });
  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <label htmlFor="title">Title</label>
        <input 
          id='title'
          name='title'
          type='text'
          onChange={formik.handleChange}
          value={formik.values.title}
        />
        <label htmlFor="description">Desciption</label>
        <input 
          id='description'
          name='description'
          type='text'
          onChange={formik.handleChange}
          value={formik.values.description}
        />
        <label htmlFor="tags">Tags</label>
        <div>
          <ReactTags 
            tags={tags}
            handleDelete={handleDelete}
            handleAddition={handleAddition}
            handleDrag={handleDrag}
            delimiters={delimiters} 
          />
        </div>
        <button type="submit">Get signed from wallet</button>
      </form>
    </>
  );
};
/*
*/

export default Form;
